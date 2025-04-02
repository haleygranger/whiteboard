import { Amplify } from '@aws-amplify/core';
import { defineConfig } from '@aws-amplify/core';

const awsConfig = defineConfig({
    Auth: {
        Cognito: {
            region: 'us-east-2', 
            userPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID,
            userPoolClientId: process.env.REACT_APP_COGNITO_USER_POOL_WEB_CLIENT_ID,
            loginWith: {
                oauth: {
                    domain: process.env.REACT_APP_COGNITO_OAUTH_DOMAIN,
                    scopes: ['openid', 'email', 'profile'],
                    redirectSignIn: process.env.REACT_APP_COGNITO_REDIRECT_SIGN_IN,
                    redirectSignOut: process.env.REACT_APP_COGNITO_REDIRECT_SIGN_OUT,
                    responseType: 'code',
                },
            },
        },
    },
});

Amplify.configure(awsConfig);
