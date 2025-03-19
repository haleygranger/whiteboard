import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from 'react-oidc-context'; 
import SignIn from "./SignIn";
import Whiteboard from "./Whiteboard";
import './App.css'

const cognitoAuthConfig = {
  authority: "https://cognito-idp.us-east-2.amazonaws.com/us-east-2_SV64Gr3VO", // Cognito domain
  client_id: "1leh5p4ea4vq0imp5nksudclsa", 
  redirect_uri: "https://main.dbiwmhwrvdu84.amplifyapp.com/whiteboard",  // redirect_uri
  response_type: "code",  // OAuth?
  scope: "email openid phone", 
};


const container = document.getElementById('root')!;
ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <AuthProvider {...cognitoAuthConfig}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SignIn />} />
          <Route path="/whiteboard" element={<Whiteboard />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
