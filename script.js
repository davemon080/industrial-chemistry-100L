document.addEventListener('DOMContentLoaded', () => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));

  if (!currentUser) {
    window.location.href = 'pages/login.html';
    return;
  }

  const tabs = document.querySelectorAll('.nav-item');
  const pages = document.querySelectorAll('.page');
  const profilePage = document.getElementById('profile');

  // Display user info and logout button on profile page
  profilePage.innerHTML = `
    <div class="card">
      <p>Logged in as: <strong>${currentUser.matricNumber}</strong></p>
      <p>Role: <strong>${currentUser.role}</strong></p>
      <button id="logoutButton" class="btn-primary" style="margin-top: 20px;">Logout</button>
    </div>
  `;

  document.getElementById('logoutButton').addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    window.location.href = 'pages/login.html';
  });
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.target;
      tabs.forEach(t => t.classList.remove('active'));
      pages.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(target).classList.add('active');
    });
  });
});
