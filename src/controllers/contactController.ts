import { Request, Response } from 'express';
import prisma from '../prismaClient';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Helper function to save base64 image
const saveBase64Image = async (base64Data: string): Promise<string> => {
  // Extract the file extension from the base64 data
  const matches = base64Data.match(/^data:image\/(.*?);base64,/);
  if (!matches || !matches[1]) {
    throw new Error('Invalid image data');
  }

  const extension = matches[1].toLowerCase();
  if (!['jpeg', 'jpg', 'png', 'gif'].includes(extension)) {
    throw new Error('Invalid image format');
  }

  // Generate unique filename
  const filename = `${uuidv4()}.${extension}`;
  const filePath = path.join(process.cwd(), 'uploads', filename);

  // Remove the data URL prefix and convert to buffer
  const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
  const imageBuffer = Buffer.from(base64Image, 'base64');

  // Save the file
  await fs.promises.writeFile(filePath, imageBuffer);
  return filename;
};

// Helper function to delete image file
const deleteImage = async (filename: string | null) => {
  if (!filename) return;
  const filePath = path.join(process.cwd(), 'uploads', filename);
  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

// GET /contacts?q=searchTerm&page=1
export const getContacts = async (req: Request, res: Response): Promise<void> => {
  try {
    const searchTerm = req.query.q ? String(req.query.q).toLowerCase() : '';
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    
    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where: searchTerm ? {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { phone: { contains: searchTerm, mode: 'insensitive' } },
            { bio: { contains: searchTerm, mode: 'insensitive' } },
          ]
        } : {},
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: {
          name: 'asc'
        }
      }),
      prisma.contact.count({
        where: searchTerm ? {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { phone: { contains: searchTerm, mode: 'insensitive' } },
            { bio: { contains: searchTerm, mode: 'insensitive' } },
          ]
        } : {}
      })
    ]);

    // Transform contacts to include full avatar URLs
    const contactsWithAvatarUrls = contacts.map(contact => ({
      ...contact,
      avatar: contact.avatar ? `/uploads/${contact.avatar}` : null
    }));

    res.json({
      contacts: contactsWithAvatarUrls,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasMore: page * pageSize < total
      }
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
};

export const createContact = async (req: Request, res: Response) => {
  try {
    const { name, phone, bio, avatar } = req.body;

    // Check if phone number already exists
    const existingContact = await prisma.contact.findFirst({
      where: { phone }
    });

    if (existingContact) {
      res.status(400).json({ error: 'Phone number already exists' });
      return;
    }

    let avatarFilename: string | null = null;
    if (avatar) {
      try {
        avatarFilename = await saveBase64Image(avatar);
      } catch (error) {
        res.status(400).json({ error: (error as Error).message });
        return;
      }
    }

    const contact = await prisma.contact.create({
      data: {
        name,
        phone,
        bio: bio || null,
        avatar: avatarFilename
      },
    });

    // Return full URL for avatar
    res.status(201).json({
      ...contact,
      avatar: contact.avatar ? `/uploads/${contact.avatar}` : null
    });
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({ error: 'Failed to create contact' });
  }
};

export const getContactById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const contact = await prisma.contact.findUnique({
      where: { id }
    });

    if (!contact) {
      res.status(404).json({ error: 'Contact not found' });
      return;
    }

    // Return full URL for avatar
    res.json({
      ...contact,
      avatar: contact.avatar ? `/uploads/${contact.avatar}` : null
    });
    return;
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
};

export const updateContact = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, phone, bio, avatar } = req.body;

    // Get existing contact
    const existingContact = await prisma.contact.findUnique({
      where: { id }
    });

    if (!existingContact) {
      res.status(404).json({ error: 'Contact not found' });
      return;
    }

    // Check phone uniqueness if phone is being updated
    if (phone && phone !== existingContact.phone) {
      const phoneExists = await prisma.contact.findFirst({
        where: { 
          phone,
          id: { not: id } // Exclude current contact
        }
      });

      if (phoneExists) {
        res.status(400).json({ error: 'Phone number already exists' });
        return;
      }
    }

    let avatarFilename = existingContact.avatar;

    // Only process avatar if it's changed and is not a path
    if (avatar && avatar !== existingContact.avatar && !avatar.startsWith('/uploads/')) {
      try {
        // Delete old avatar if it exists
        if (existingContact.avatar) {
          await deleteImage(existingContact.avatar);
        }
        avatarFilename = await saveBase64Image(avatar);
      } catch (error) {
        res.status(400).json({ error: (error as Error).message });
        return;
      }
    }

    const updatedContact = await prisma.contact.update({
      where: { id },
      data: {
        name: name || undefined,
        phone: phone || undefined,
        bio: bio === '' ? null : bio || undefined,
        avatar: avatarFilename
      }
    });

    res.json({
      ...updatedContact,
      avatar: updatedContact.avatar ? `/uploads/${updatedContact.avatar}` : null
    });
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ error: 'Failed to update contact' });
  }
};

export const deleteContact = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const contact = await prisma.contact.findUnique({ where: { id } });
    if (!contact) {
      res.status(404).json({ error: 'Contact not found' });
      return;
    }

    // Delete the contact's avatar if it exists
    if (contact.avatar) {
      await deleteImage(contact.avatar);
    }

    await prisma.contact.delete({ where: { id } });
    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
};
