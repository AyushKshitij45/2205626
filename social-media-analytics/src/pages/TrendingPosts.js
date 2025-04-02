import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Alert, Badge } from 'react-bootstrap';
import { fetchPosts, fetchUsers, fetchComments } from '../api/apiService';
import LoadingSpinner from '../components/LoadingSpinner';

function TrendingPosts() {
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [maxCommentCount, setMaxCommentCount] = useState(0);

  useEffect(() => {
    const fetchTrendingPosts = async () => {
      try {
        setLoading(true);
        
        // Fetch posts and users
        const [posts, users] = await Promise.all([fetchPosts(), fetchUsers()]);
        
        // Create a map of users for quick lookups
        const userMap = users.reduce((map, user) => {
          map[user.id] = user;
          return map;
        }, {});
        
        // Fetch comments for each post and compute comment counts
        const postsWithCommentsPromises = posts.map(async post => {
          const comments = await fetchComments(post.id);
          return {
            ...post,
            // Convert userid to string to match our user map keys
            user: userMap[post.userid.toString()],
            // Use content field as post body
            title: post.content.substring(0, 30) + (post.content.length > 30 ? '...' : ''),
            body: post.content,
            comments,
            commentCount: comments.length,
            // Random image for the post
            imageUrl: `https://picsum.photos/seed/${post.id}/300/200`
          };
        });
        
        const postsWithComments = await Promise.all(postsWithCommentsPromises);
        
        // Find max comment count
        const maxCount = Math.max(...postsWithComments.map(post => post.commentCount), 0);
        setMaxCommentCount(maxCount);
        
        // Filter posts with the maximum comment count
        const trending = postsWithComments.filter(post => post.commentCount === maxCount && maxCount > 0);
        
        setTrendingPosts(trending);
        setLoading(false);
      } catch (err) {
        setError('Failed to load trending posts. Please try again later.');
        setLoading(false);
        console.error('Error in fetchTrendingPosts:', err);
      }
    };

    fetchTrendingPosts();
    
    // Set up polling for real-time updates
    const intervalId = setInterval(fetchTrendingPosts, 30000); // Poll every 30 seconds
    
    return () => clearInterval(intervalId); // Cleanup on component unmount
  }, []);

  if (loading) {
    return <LoadingSpinner message="Finding trending posts..." />;
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <div>
      <h2 className="page-header">
        Trending Posts 
        {maxCommentCount > 0 && (
          <Badge bg="info" className="ms-2">
            {maxCommentCount} comments
          </Badge>
        )}
      </h2>
      
      {trendingPosts.length === 0 ? (
        <Alert variant="info">No trending posts found. Posts need at least one comment to trend.</Alert>
      ) : (
        <Row>
          {trendingPosts.map(post => (
            <Col lg={6} className="mb-4" key={post.id}>
              <Card className="h-100 shadow">
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
                    <Badge bg="primary" pill>
                      {post.commentCount} comments
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

export default TrendingPosts;