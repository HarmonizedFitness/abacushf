// Test login functionality
const loginData = {
  email: "john@doe.com",
  password: "johndoe123"
};

console.log("Testing login with admin credentials:", loginData.email);

fetch('http://localhost:3000/api/auth/signin', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(loginData)
})
.then(response => {
  console.log("Response status:", response.status);
  console.log("Response headers:", [...response.headers.entries()]);
  return response.text();
})
.then(data => {
  console.log("Response body:", data.substring(0, 200) + "...");
})
.catch(error => {
  console.error("Login test error:", error);
});
