document.addEventListener('DOMContentLoaded', () => {
  const courseTitleElement = document.getElementById('courseTitle');
  const addMaterialBtn = document.getElementById('addMaterialBtn');
  const materialList = document.getElementById('materialList');
  const addMaterialModal = document.getElementById('addMaterialModal');
  const addMaterialForm = document.getElementById('addMaterialForm');
  const materialTypeSelect = document.getElementById('materialType');
  const pdfInputGroup = document.getElementById('pdfInputGroup');
  const youtubeInputGroup = document.getElementById('youtubeInputGroup');
  const progressBarContainer = document.getElementById('progressBarContainer');
  const progressBar = document.getElementById('progressBar');

  const urlParams = new URLSearchParams(window.location.search);
  const courseCode = urlParams.get('course');

  const courses = {
    "ICH101": "Fundamentals of Industrial Chemistry",
    "ICH102": "Organic Chemistry I",
    "ICH103": "Physical Chemistry I",
    "ICH201": "Inorganic Chemistry",
    "ICH202": "Analytical Chemistry",
    "ICH203": "Polymer Chemistry",
    "ICH301": "Industrial Chemical Processes",
    "ICH302": "Environmental Chemistry",
    "ICH303": "Petrochemical Studies"
  };

  courseTitleElement.textContent = courses[courseCode] || 'Unknown Course';

  const currentUser = JSON.parse(localStorage.getItem('currentUser'));

  if (currentUser && currentUser.role === 'course_rep') {
    addMaterialBtn.style.display = 'block';
  }

  addMaterialBtn.addEventListener('click', () => {
    addMaterialModal.style.display = 'flex';
  });

  addMaterialModal.querySelector('.close-btn').addEventListener('click', () => {
    addMaterialModal.style.display = 'none';
  });

  materialTypeSelect.addEventListener('change', () => {
    if (materialTypeSelect.value === 'pdf') {
      pdfInputGroup.style.display = 'block';
      youtubeInputGroup.style.display = 'none';
    } else {
      pdfInputGroup.style.display = 'none';
      youtubeInputGroup.style.display = 'block';
    }
  });

  addMaterialForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const materialTitle = document.getElementById('materialTitle').value;
    const materialType = document.getElementById('materialType').value;
    
    let materialLink;

    if (materialType === 'pdf') {
      const pdfFile = document.getElementById('pdfFile').files[0];
      if (!pdfFile) {
        alert('Please select a PDF file.');
        return;
      }
      // Simulate file upload and get a blob URL
      simulateUpload(pdfFile).then(url => {
        materialLink = url;
        saveMaterial(materialTitle, materialType, materialLink);
      });
    } else {
      materialLink = document.getElementById('youtubeLink').value;
      if (!materialLink) {
        alert('Please enter a YouTube video ID.');
        return;
      }
      saveMaterial(materialTitle, materialType, materialLink);
    }
  });

  function simulateUpload(file) {
    return new Promise(resolve => {
      progressBarContainer.style.display = 'block';
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        progressBar.style.width = `${progress}%`;
        if (progress >= 100) {
          clearInterval(interval);
          progressBarContainer.style.display = 'none';
          progressBar.style.width = '0%';
          // In a real app, this would be the URL from the server
          // For now, we use a blob URL
          const blobUrl = URL.createObjectURL(file);
          resolve(blobUrl);
        }
      }, 200);
    });
  }

  function saveMaterial(title, type, link) {
    const materials = JSON.parse(localStorage.getItem('materials')) || {};
    if (!materials[courseCode]) {
      materials[courseCode] = [];
    }

    materials[courseCode].push({
      title: title,
      type: type,
      link: link
    });

    localStorage.setItem('materials', JSON.stringify(materials));
    addMaterialModal.style.display = 'none';
    addMaterialForm.reset();
    loadMaterials();
  }

  function loadMaterials() {
    materialList.innerHTML = '';
    const materials = JSON.parse(localStorage.getItem('materials')) || {};
    const courseMaterials = materials[courseCode] || [];

    if (courseMaterials.length === 0) {
      materialList.innerHTML = '<p>No materials available for this course yet.</p>';
      return;
    }

    courseMaterials.forEach(material => {
      const materialItem = document.createElement('div');
      materialItem.classList.add('material-item');
      materialItem.innerHTML = `
        <div class="material-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            ${material.type === 'pdf' ? '<path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M4 22h16a2 2 0 0 0 2-2V8l-6-6H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2z"/><path d="M2 12h8"/><path d="M2 16h8"/><path d="M2 20h8"/></svg>' : '<path d="M2.5 17a24.12 24.12 0 0 1 0-10C2.5 7 7 2.5 12 2.5s9.5 4.5 9.5 9.5a24.12 24.12 0 0 1 0 10C21.5 17 17 21.5 12 21.5s-9.5-4.5-9.5-9.5z"/><path d="m10 15 5-3-5-3z"/>'}
          </svg>
        </div>
        <div class="material-info">
          <div class="material-title">${material.title}</div>
          <div class="material-type">${material.type.toUpperCase()}</div>
        </div>
      `;
      materialItem.addEventListener('click', () => {
        if (material.type === 'pdf') {
          openPdfModal(material.link);
        } else {
          openVideoModal(material.link);
        }
      });
      materialList.appendChild(materialItem);
    });
  }

  function openVideoModal(videoId) {
    const modal = document.createElement('div');
    modal.classList.add('modal');
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close-btn">&times;</span>
        <iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      </div>
    `;
    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  function openPdfModal(pdfLink) {
    const modal = document.createElement('div');
    modal.classList.add('modal');
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close-btn">&times;</span>
        <iframe src="${pdfLink}" frameborder="0" width="100%" height="100%"></iframe>
      </div>
    `;
    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  loadMaterials();
});
