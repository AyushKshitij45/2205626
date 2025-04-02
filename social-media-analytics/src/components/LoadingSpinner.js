import React from 'react';
import { Spinner } from 'react-bootstrap';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="d-flex flex-column justify-content-center align-items-center my-5">
      <Spinner animation="border" role="status" variant="primary">
        <span className="visually-hidden">{message}</span>
      </Spinner>
      <p className="mt-3 text-muted">{message}</p>
    </div>
  );
};

export default LoadingSpinner;