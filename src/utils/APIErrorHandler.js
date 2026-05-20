export const handleApiError = (error) => {
  if (error.response?.data) {
    return error.response.data;
  }
  return { success: false, message: 'An error occurred' };
};
