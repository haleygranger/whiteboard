declare const awsmobile: {
    Auth: {
        region: string;
        userPoolId: string;
        userPoolWebClientId: string;
        oauth?: {
            domain: string;
            scope: string[];
            redirectSignIn: string;
            redirectSignOut: string;
            responseType: string;
        };
        };
    };
    
    export default awsmobile;