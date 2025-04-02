import React, { useState, useEffect, useRef } from 'react';
import { Card, Row, Col, Alert, Button, Spinner, Badge } from 'react-bootstrap';
import { fetchPosts, fetchUsers } from '../api/apiService';
import LoadingSpinner from '../components/LoadingSpinner';

function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const latestPostIdRef = useRef(null);

  // Function to fetch and process posts
  const fetchFeedPosts = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      }
      
      // Fetch posts and users
      const [newPosts, users] = await Promise.all([fetchPosts(), fetchUsers()]);
      
      // Create a map of users for quick lookups
      const userMap = users.reduce((map, user) => {
        map[user.id] = user;
        return map;
      }, {});
      
      // Process posts with user info and random images
      const processedPosts = newPosts.map(post => ({
        ...post,
        // Convert userid to string to match our user map keys
        user: userMap[post.userid.toString()],
        // Use content field as post body
        title: post.content.substring(0, 30) + (post.content.length > 30 ? '...' : ''),
        body: post.content,
        imageUrl: `https://picsum.photos/seed/${post.id}/300/200`,
        timestamp: new Date().getTime() // Add current timestamp for sorting
      }));
      
      // Sort by timestamp (newest first)
      const sortedPosts = processedPosts.sort((a, b) => b.timestamp - a.timestamp);
      
      // Check if we have new posts
      const hasNewPosts = latestPostIdRef.current !== null && 
                          sortedPosts.length > 0 && 
                          sortedPosts[0].id !== latestPostIdRef.current;
      
      // Update latest post ID reference
      if (sortedPosts.length > 0) {
        latestPostIdRef.current = sortedPosts[0].id;
      }
      
      // Update state
      setPosts(sortedPosts);
      setLoading(false);
      setRefreshing(false);
      
      // Notify about new posts if applicable
      if (hasNewPosts) {
        // Could implement a notification here
        console.log('New posts available!');
      }
    } catch (err) {
      setError('Failed to load feed. Please try again later.');
      setLoading(false);
      setRefreshing(false);
      console.error('Error in fetchFeedPosts:', err);
    }
  };

  useEffect(() => {
    fetchFeedPosts();
    
    // Set up polling for real-time updates
    const intervalId = setInterval(() => fetchFeedPosts(), 10000); // Poll every 10 seconds
    
    return () => clearInterval(intervalId); // Cleanup on component unmount
  }, []);

  const handleRefresh = () => {
    fetchFeedPosts(true);
  };

  if (loading && posts.length === 0) {
    return <LoadingSpinner message="Loading feed..." />;
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="m-0">Latest Posts</h2>
        <Button 
          variant="outline-primary" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
              <span className="ms-2">Refreshing...</span>
            </>
          ) : 'Refresh Feed'}
        </Button>
      </div>
      
      {posts.length === 0 ? (
        <Alert variant="info">No posts available.</Alert>
      ) : (
        <Row>
          {posts.map(post => (
            <Col lg={6} className="mb-4" key={post.id}>
              <Card className="h-100 shadow-sm">
                <Card.Img variant="top" src={post.imageUrl} />
                <Card.Body>
                  <Card.Title>{post.title}</Card.Title>
                  <Card.Text>{post.body}</Card.Text>
                </Card.Body>
                <Card.Footer>
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      Posted by: {post.user?.name || 'Unknown User'}
                    </small>
                    <Badge bg="secondary" pill>
                      Post ID: {post.id}
                    </Badge>
                  </div>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}

export default Feed;