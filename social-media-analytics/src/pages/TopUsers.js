import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Alert, Badge } from 'react-bootstrap';
import { fetchUsers, fetchPosts } from '../api/apiService';
import LoadingSpinner from '../components/LoadingSpinner';

function TopUsers() {
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopUsers = async () => {
      try {
        setLoading(true);
        
        // Fetch users and posts in parallel
        const [users, posts] = await Promise.all([fetchUsers(), fetchPosts()]);
        
        // Count posts per user
        const userPostCounts = {};
        
        posts.forEach(post => {
          // The API returns post.userid (not userId)
          const userId = post.userid.toString();
          if (!userPostCounts[userId]) {
            userPostCounts[userId] = 0;
          }
          userPostCounts[userId]++;
        });
        
        // Map user IDs to user objects with post counts
        const usersWithPostCounts = users.map(user => ({
          ...user,
          postCount: userPostCounts[user.id] || 0,
          // Random image for each user
          imageUrl: `https://picsum.photos/seed/${user.id}/150`
        }));
        
        // Sort by post count in descending order and take top 5
        const sortedUsers = usersWithPostCounts
          .sort((a, b) => b.postCount - a.postCount)
          .slice(0, 5);
        
        setTopUsers(sortedUsers);
        setLoading(false);
      } catch (err) {
        setError('Failed to load top users. Please try again later.');
        setLoading(false);
        console.error('Error in fetchTopUsers:', err);
      }
    };

    fetchTopUsers();
    
    // Set up polling for real-time updates
    const intervalId = setInterval(fetchTopUsers, 30000); // Poll every 30 seconds
    
    return () => clearInterval(intervalId); // Cleanup on component unmount
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading top users..." />;
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <div>
      <h2 className="page-header">Top 5 Users by Post Count</h2>
      <Row>
        {topUsers.map((user, index) => (
          <Col md={4} sm={6} key={user.id} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Img variant="top" src={user.imageUrl} />
              <Card.Body>
                <Card.Title>
                  {user.name}
                  <Badge bg="success" className="ms-2">Rank #{index + 1}</Badge>
                </Card.Title>
                <Card.Text>
                  <strong>Username:</strong> {user.username}<br/>
                  <strong>Posts:</strong> {user.postCount}<br/>
                  <strong>Email:</strong> {user.email}
                </Card.Text>
              </Card.Body>
              <Card.Footer className="text-muted d-flex justify-content-between">
                <span>User ID: {user.id}</span>
                <Badge bg="primary" pill>{user.postCount} posts</Badge>
              </Card.Footer>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}

export default TopUsers;