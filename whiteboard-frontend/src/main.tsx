import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SignIn from "./SignIn";
import Whiteboard from "./Whiteboard";
import GuestSignIn from "./GuestSignIn";
import GuestSignInWithSession from "./GuestSignInWithSession";
import './App.css';

const App: React.FC = () => {
  const [isAuth, setIsAuth] = useState(false); // Store authentication state

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SignIn setAuthStatus={setIsAuth} />} />
        <Route path="/whiteboard" element={<Whiteboard isAuth={isAuth} />} />
        <Route path="/GuestSignIn" element={<GuestSignIn />} />
        <Route path="/GuestSignInSession" element={<GuestSignInWithSession />} />
      </Routes>
    </BrowserRouter>
  );
};

// Render the App component in the root div
const container = document.getElementById('root')!;
ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

export default App;
