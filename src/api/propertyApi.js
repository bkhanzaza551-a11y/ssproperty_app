import apiClient from './apiClient';

/**
 * Property API Service
 * Maps to Postman 'Properties' folder
 */

// GET /api/v1/properties
export const getProperties = async (params = {}) => {
    // Postman: Supports search, city, type, minPrice, maxPrice, agentId, franchiseId
    return apiClient.get('/properties', { params });
};

// GET /api/v1/properties/:id
export const getPropertyById = async (id) => {
    return apiClient.get(`/properties/${id}`);
};

// GET /api/v1/properties/franchise/:franchiseId
export const getPropertiesByFranchise = async (franchiseId) => {
    return apiClient.get(`/properties/franchise/${franchiseId}`);
};

// GET /api/v1/properties/agent/:agentId
export const getPropertiesByAgent = async (agentId) => {
    return apiClient.get(`/properties/agent/${agentId}`);
};

// POST /api/v1/properties
export const addProperty = async (formData) => {
    return apiClient.post('/properties', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

// PUT /api/v1/properties/:id
export const updateProperty = async (id, formData) => {
    return apiClient.put(`/properties/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

// DELETE /api/v1/properties/:id
export const deleteProperty = async (id) => {
    return apiClient.delete(`/properties/${id}`);
};

// My Properties (Backend endpoint for properties by agent)
export const getMyProperties = async (userId) => {
    return apiClient.get(`/properties/agent/${userId}`);
};


