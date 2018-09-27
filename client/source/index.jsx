import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';

// START SOLUTION
import { App } from './App';
// END SOLUTION

// START SOLUTION
ReactDOM.render((
  <BrowserRouter>
    <App />
  </BrowserRouter>
), document.getElementById('app'));
// END SOLUTION
