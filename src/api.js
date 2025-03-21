import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5434';

// ✅ Updated Sign-In API to include employee_name & address
export const signIn = async (employee_id, employee_name, latitude, longitude, address) => {
    try {
        const response = await axios.post(`${API_URL}/sign-in`, {
            employee_id,
            employee_name,
            latitude,
            longitude,
            address
        });
        return response.data;
    } catch (error) {
        console.error("Error signing in:", error.response ? error.response.data : error.message);
        throw error;
    }
};

// ✅ Updated Sign-Out API to include location & address
export const signOut = async (employee_id, latitude, longitude, address) => {
    try {
        const response = await axios.post(`${API_URL}/sign-out`, {
            employee_id,
            latitude,
            longitude,
            address
        });
        return response.data;
    } catch (error) {
        console.error("Error signing out:", error.response ? error.response.data : error.message);
        throw error;
    }
};
