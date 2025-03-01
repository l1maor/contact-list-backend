import request from 'supertest';
import app from '../../src/app';
import { prismaMock } from '../singleton';
import path from 'path';
import fs from 'fs';

// Make sure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

describe('Contact Controller', () => {
  // Test data
  const testContact = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'John Doe',
    phone: '+1234567890',
    bio: 'Test bio',
    createdAt: new Date(),
    updatedAt: new Date(),
    avatar: null
  };

  const testImagePath = path.join(__dirname, '../fixtures/test-avatar.jpg');

  beforeAll(() => {
    // Create test image if it doesn't exist
    if (!fs.existsSync(testImagePath)) {
      const testImageDir = path.dirname(testImagePath);
      if (!fs.existsSync(testImageDir)) {
        fs.mkdirSync(testImageDir, { recursive: true });
      }
      // Create a small test image
      fs.writeFileSync(testImagePath, Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear uploads directory before each test
    const files = fs.readdirSync('uploads');
    for (const file of files) {
      if (file !== '.gitkeep') {
        fs.unlinkSync(path.join('uploads', file));
      }
    }
  });

  afterAll(() => {
    // Clean up test image
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
  });

  describe('GET /contacts', () => {
    it('should return all contacts with pagination', async () => {
      const mockContacts = [
        { ...testContact, name: 'John Smith', phone: '+1111111111', bio: 'Test bio 1' },
        { ...testContact, name: 'Jane Doe', phone: '+2222222222', bio: 'Test bio 2' },
        { ...testContact, name: 'Bob Johnson', phone: '+3333333333', bio: 'Test bio 3' }
      ];

      // Mock both the count and findMany calls
      prismaMock.contact.count.mockResolvedValue(3);
      prismaMock.contact.findMany.mockResolvedValue(mockContacts);

      const res = await request(app).get('/contacts');
      expect(res.status).toBe(200);
      expect(res.body.contacts).toHaveLength(3);
      expect(res.body.pagination).toMatchObject({
        page: 1,
        pageSize: 10,
        total: 3,
        totalPages: 1,
        hasMore: false
      });
    });

    it('should filter contacts by search term (case-insensitive)', async () => {
      const mockContact = { ...testContact, name: 'John Smith' };
      
      // Mock both the count and findMany calls
      prismaMock.contact.count.mockResolvedValue(1);
      prismaMock.contact.findMany.mockResolvedValue([mockContact]);

      const res = await request(app).get('/contacts?q=john');
      expect(res.status).toBe(200);
      expect(res.body.contacts).toHaveLength(1);
      expect(res.body.contacts[0].name).toBe('John Smith');
    });

    it('should handle pagination correctly', async () => {
      const mockContacts = [
        { ...testContact, name: 'John Smith', phone: '+1111111111' },
        { ...testContact, name: 'Jane Doe', phone: '+2222222222' }
      ];

      // Mock both the count and findMany calls with pagination params
      prismaMock.contact.count.mockResolvedValue(5); // Total 5 contacts
      prismaMock.contact.findMany.mockResolvedValue(mockContacts);

      const res = await request(app).get('/contacts?page=1&pageSize=2');
      expect(res.status).toBe(200);
      expect(res.body.contacts).toHaveLength(2);
      expect(res.body.pagination).toMatchObject({
        page: 1,
        pageSize: 2,
        total: 5,
        totalPages: 3,
        hasMore: true
      });

      // Verify that findMany was called with correct pagination params
      expect(prismaMock.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 2,
          skip: 0
        })
      );
    });
  });

  describe('GET /contacts/:id', () => {
    it('should return a single contact', async () => {
      prismaMock.contact.findUnique.mockResolvedValue(testContact);

      const res = await request(app).get(`/contacts/${testContact.id}`);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: testContact.id,
        name: testContact.name,
        phone: testContact.phone,
        bio: testContact.bio
      });
    });

    it('should return 404 for non-existent contact', async () => {
      prismaMock.contact.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get('/contacts/00000000-0000-4000-a000-000000000000');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Contact not found');
    });
  });

  describe('POST /contacts', () => {
    it('should create a new contact with avatar', async () => {
      const contactWithAvatar = { 
        ...testContact, 
        avatar: '/uploads/test-avatar.jpg' 
      };
      
      prismaMock.contact.findFirst.mockResolvedValue(null); // Phone uniqueness check
      prismaMock.contact.create.mockResolvedValue(contactWithAvatar);

      // Read test image and convert to base64
      const imageBuffer = await fs.promises.readFile(testImagePath);
      const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

      const res = await request(app)
        .post('/contacts')
        .send({
          name: testContact.name,
          phone: testContact.phone,
          bio: testContact.bio,
          avatar: base64Image
        });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        name: testContact.name,
        phone: testContact.phone,
        bio: testContact.bio
      });
      expect(res.body.avatar).toMatch(/^\/uploads\/.+\.(jpg|jpeg|png|gif)$/i);
    });

    it('should create a contact without avatar', async () => {
      prismaMock.contact.create.mockResolvedValue(testContact);
      prismaMock.contact.findFirst.mockResolvedValue(null); // For phone uniqueness check

      const res = await request(app)
        .post('/contacts')
        .send({
          name: testContact.name,
          phone: testContact.phone,
          bio: testContact.bio
        });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        name: testContact.name,
        phone: testContact.phone,
        bio: testContact.bio
      });
      expect(res.body.avatar).toBeNull();
    });
  });

  describe('PUT /contacts/:id', () => {
    it('should update an existing contact', async () => {
      const updatedContact = { ...testContact, name: 'Updated Name' };
      prismaMock.contact.findUnique.mockResolvedValue(testContact);
      prismaMock.contact.update.mockResolvedValue(updatedContact);
      prismaMock.contact.findFirst.mockResolvedValue(null); // For phone uniqueness check

      const res = await request(app)
        .put(`/contacts/${testContact.id}`)
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: testContact.id,
        name: 'Updated Name'
      });
    });

    it('should return 404 for non-existent contact', async () => {
      prismaMock.contact.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .put(`/contacts/${testContact.id}`)
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Contact not found');
    });
  });

  describe('DELETE /contacts/:id', () => {
    it('should delete an existing contact', async () => {
      prismaMock.contact.findUnique.mockResolvedValue(testContact);
      prismaMock.contact.delete.mockResolvedValue(testContact);

      const res = await request(app).delete(`/contacts/${testContact.id}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Contact deleted successfully');
    });

    it('should return 404 for non-existent contact', async () => {
      prismaMock.contact.findUnique.mockResolvedValue(null);

      const res = await request(app).delete(`/contacts/${testContact.id}`);
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Contact not found');
    });
  });
});
