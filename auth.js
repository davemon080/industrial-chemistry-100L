document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const matricNumberInput = document.getElementById('matricNumber');
      const passwordInput = document.getElementById('password');
      const confirmPasswordInput = document.getElementById('confirmPassword');

      const matricNumber = matricNumberInput.value.trim();
      const password = passwordInput.value;
      const confirmPassword = confirmPasswordInput.value;

      // Matric number validation
      const matricRegex = /^2025\/PS\/ICH\/\d{4}$/;
      if (!matricRegex.test(matricNumber)) {
        alert('Invalid matric number format. It should be in the format 2025/PS/ICH/xxxx');
        return;
      }

      if (password !== confirmPassword) {
        alert('Passwords do not match.');
        return;
      }

      // Check if user already exists
      const users = JSON.parse(localStorage.getItem('users')) || [];
      if (users.find(user => user.matricNumber === matricNumber)) {
        alert('User with this matric number already exists.');
        return;
      }

      const role = matricNumber === '2025/PS/ICH/0034' ? 'course_rep' : 'student';

      // In a real app, you would hash the password. For simplicity, we are storing it as plain text.
      const newUser = {
        matricNumber,
        password,
        role,
      };

      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));

      alert('Registration successful! You can now log in.');
      window.location.href = 'login.html';
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const matricNumberInput = document.getElementById('matricNumber');
      const passwordInput = document.getElementById('password');

      const matricNumber = matricNumberInput.value.trim();
      const password = passwordInput.value;

      const users = JSON.parse(localStorage.getItem('users')) || [];
      const user = users.find(u => u.matricNumber === matricNumber && u.password === password);

      if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        alert('Login successful!');
        window.location.href = '../index.html';
      } else {
        alert('Invalid matric number or password.');
      }
    });
  }
});
