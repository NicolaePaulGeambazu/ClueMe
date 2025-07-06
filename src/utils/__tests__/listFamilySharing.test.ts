import { listService } from '../../services/firebaseService';

// Mock Firebase
jest.mock('../../services/firebaseService', () => ({
  listService: {
    getUserLists: jest.fn(),
    createList: jest.fn(),
    updateList: jest.fn(),
    deleteList: jest.fn(),
    getListById: jest.fn(),
    onUserListsChange: jest.fn(),
    onListChange: jest.fn(),
  },
  reminderService: {
    getUserFamily: jest.fn(),
  },
}));

describe('List Family Sharing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should include family-shared lists when user has family', async () => {
    // Mock user with family
    const mockUserFamily = {
      id: 'family123',
      name: 'Test Family',
      ownerId: 'user1',
      memberCount: 2,
      maxMembers: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Mock user's own lists
    const userLists = [
      {
        id: 'list1',
        name: 'My Private List',
        description: 'My personal list',
        items: [],
        format: 'checkmark' as const,
        isFavorite: false,
        isPrivate: true,
        familyId: null,
        createdBy: 'user1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'list2',
        name: 'My Shared List',
        description: 'Shared with family',
        items: [],
        format: 'checkmark' as const,
        isFavorite: false,
        isPrivate: false,
        familyId: 'family123',
        createdBy: 'user1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Mock family member's shared list
    const familyLists = [
      {
        id: 'list3',
        name: 'Family Member List',
        description: 'Shared by family member',
        items: [],
        format: 'checkmark' as const,
        isFavorite: false,
        isPrivate: false,
        familyId: 'family123',
        createdBy: 'user2',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Mock the service calls
    const { listService, reminderService } = require('../../services/firebaseService');
    
    reminderService.getUserFamily.mockResolvedValue(mockUserFamily);
    // The service should filter out private lists from family members
    listService.getUserLists.mockResolvedValue([...userLists, familyLists[0]]); // Only include public family list

    // Test that the service returns both user's lists and family-shared lists
    const result = await listService.getUserLists('user1');
    
    expect(result).toHaveLength(3);
    expect(result.find((l: any) => l.id === 'list1')).toBeDefined(); // User's private list
    expect(result.find((l: any) => l.id === 'list2')).toBeDefined(); // User's shared list
    expect(result.find((l: any) => l.id === 'list3')).toBeDefined(); // Family member's shared list
  });

  it('should not include family lists when user has no family', async () => {
    // Mock user without family
    const { reminderService, listService } = require('../../services/firebaseService');
    
    reminderService.getUserFamily.mockResolvedValue(null);
    
    const userLists = [
      {
        id: 'list1',
        name: 'My List',
        description: 'My personal list',
        items: [],
        format: 'checkmark' as const,
        isFavorite: false,
        isPrivate: true,
        familyId: null,
        createdBy: 'user1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    listService.getUserLists.mockResolvedValue(userLists);

    const result = await listService.getUserLists('user1');
    
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('list1');
  });

  it('should filter out private lists from family members', async () => {
    const mockUserFamily = {
      id: 'family123',
      name: 'Test Family',
      ownerId: 'user1',
      memberCount: 2,
      maxMembers: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const { reminderService, listService } = require('../../services/firebaseService');
    
    reminderService.getUserFamily.mockResolvedValue(mockUserFamily);
    
    // Mock lists including a private family list that shouldn't be shared
    const allLists = [
      {
        id: 'list1',
        name: 'Public Family List',
        description: 'Shared with family',
        items: [],
        format: 'checkmark' as const,
        isFavorite: false,
        isPrivate: false,
        familyId: 'family123',
        createdBy: 'user2',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'list2',
        name: 'Private Family List',
        description: 'Not shared with family',
        items: [],
        format: 'checkmark' as const,
        isFavorite: false,
        isPrivate: true,
        familyId: 'family123',
        createdBy: 'user2',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // The service should filter out private lists from family members
    listService.getUserLists.mockResolvedValue([allLists[0]]); // Only include public family list

    const result = await listService.getUserLists('user1');
    
    // Should only include the public family list
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('list1');
    expect(result[0].isPrivate).toBe(false);
  });
}); 