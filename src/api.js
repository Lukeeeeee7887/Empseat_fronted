export const API_BASE_URL =  'http://localhost:8080/api';

console.log("API_BASE_URL:", API_BASE_URL);


export const apiEndpoints = {
  seating: {
    getByFloor: (floor) => `${API_BASE_URL}/seating/floor/${floor}`,
    assign: `${API_BASE_URL}/seating/assign`,
    clear: `${API_BASE_URL}/seating/clear`,
  },
  employees: {
    getAll: `${API_BASE_URL}/employees`,
    getById: (empId) => `${API_BASE_URL}/employees/${empId}`,
  },
};