import keycloak from '../features/auth/keycloak';

export const UserProfile = () => {
    return (
        <div style={{ 
            padding: '10px', 
            background: '#f0f4f8', 
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        }}>
            <span>Welcome, <strong>{keycloak.tokenParsed?.preferred_username}</strong>!</span>
            <button 
                onClick={() => keycloak.logout()}
                style={{ background: '#ff4d4f', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
            >
                Logout
            </button>
        </div>
    );
};