// Use a CORS proxy to overcome the CORS issue
const CORS_PROXY = 'https://corsproxy.io/?';
const API_URL = 'http://20.244.56.144/evaluation-service';
const API_BASE_URL = `${CORS_PROXY}${encodeURIComponent(API_URL)}`;

// Cache for API responses
let cache = {
  users: null,
  posts: null,
  lastFetchTime: {
    users: null,
    posts: null
  }
};

const isCacheValid = (type) => {
  if (!cache.lastFetchTime[type]) return false;
  const now = Date.now();
  return now - cache.lastFetchTime[type] < 5000; // 5 seconds TTL
};

// Fetch users data with caching
export const fetchUsers = async () => {
  if (isCacheValid('users') && cache.users) {
    return cache.users;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users`);
    const data = await response.json();

    const processedUsers = Object.entries(data.users).map(([id, name]) => ({
      id,
      name
    }));
    
    // Update cache
    cache.users = processedUsers;
    cache.lastFetchTime.users = Date.now();
    
    return processedUsers;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Fetch all posts data with caching
export const fetchPosts = async () => {
  if (isCacheValid('posts') && cache.posts) {
    return cache.posts;
  }

  try {
    // First, get all users
    const users = await fetchUsers();
    
    // Then fetch posts for each user in parallel
    const allPostsPromises = users.map(user => 
      fetch(`${API_BASE_URL}/users/${user.id}/posts`)
        .then(response => response.json())
        .then(data => data.posts || [])
        .catch(error => {
          console.error(`Error fetching posts for user ${user.id}:`, error);
          return []; // Return empty array in case of error
        })
    );
    
    // Wait for all requests to complete
    const userPostsArrays = await Promise.all(allPostsPromises);
    
    // Flatten all user posts into a single array
    const allPosts = userPostsArrays.flat();
    
    // Update cache
    cache.posts = allPosts;
    cache.lastFetchTime.posts = Date.now();
    
    return allPosts;
  } catch (error) {
    console.error('Error fetching all posts:', error);
    throw error;
  }
};

// Fetch comments for a specific post
export const fetchComments = async (postId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`);
    
    // If the API call fails, return an empty array
    if (!response.ok) {
      console.warn(`No comments endpoint available for post ${postId} or request failed`);
      return [];
    }
    
    const data = await response.json();
    
    // Return the comments array, or empty array if none
    return data.comments || [];
  } catch (error) {
    console.error(`Error fetching comments for post ${postId}:`, error);
    // Return empty array instead of throwing to keep app functional
    return [];
  }
};