(function() {
  'use strict';

  // Check if Three.js is loaded
  if (typeof THREE === 'undefined') {
    console.warn('Three.js is not loaded');
    return;
  }

  // Configuration
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const config = {
    particleCount: isMobile ? 50 : 100,
    geometryCount: isMobile ? 3 : 6,
    antialias: !isMobile,
    pixelRatioCap: 2,
    colors: {
      primary: 0x008073,
      secondary: 0xa7ffeb,
      dark: 0x004d40
    }
  };

  // Get canvas element
  const canvas = document.getElementById('threejs-canvas');
  if (!canvas) {
    console.warn('Three.js canvas not found');
    return;
  }

  // Scene setup
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
  camera.position.z = 30;

  // Renderer setup
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: config.antialias,
    alpha: true
  });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, config.pixelRatioCap));
  renderer.setClearColor(0x000000, 0);

  // Mouse/touch tracking
  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

  // Create particles
  const particleGeometry = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(config.particleCount * 3);
  const particleSpeeds = [];

  for (let i = 0; i < config.particleCount; i++) {
    particlePositions[i * 3] = (Math.random() - 0.5) * 60;
    particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 60;
    particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 30;
    particleSpeeds.push({
      x: (Math.random() - 0.5) * 0.02,
      y: (Math.random() - 0.5) * 0.02,
      z: (Math.random() - 0.5) * 0.01
    });
  }

  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

  const particleMaterial = new THREE.PointsMaterial({
    color: config.colors.secondary,
    size: isMobile ? 0.3 : 0.2,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  });

  const particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);

  // Create geometric shapes
  const geometries = [];
  const geometryTypes = [
    () => new THREE.IcosahedronGeometry(2, 0),
    () => new THREE.OctahedronGeometry(2, 0),
    () => new THREE.TorusGeometry(1.5, 0.4, 8, 16)
  ];

  const shapeMaterial = new THREE.MeshBasicMaterial({
    color: config.colors.primary,
    wireframe: true,
    transparent: true,
    opacity: 0.4
  });

  for (let i = 0; i < config.geometryCount; i++) {
    const geometryType = geometryTypes[i % geometryTypes.length];
    const geometry = geometryType();
    const mesh = new THREE.Mesh(geometry, shapeMaterial.clone());

    mesh.position.x = (Math.random() - 0.5) * 40;
    mesh.position.y = (Math.random() - 0.5) * 40;
    mesh.position.z = (Math.random() - 0.5) * 20 - 10;

    mesh.rotation.x = Math.random() * Math.PI;
    mesh.rotation.y = Math.random() * Math.PI;

    mesh.userData = {
      rotationSpeed: {
        x: (Math.random() - 0.5) * 0.01,
        y: (Math.random() - 0.5) * 0.01,
        z: (Math.random() - 0.5) * 0.005
      },
      floatSpeed: Math.random() * 0.5 + 0.5,
      floatOffset: Math.random() * Math.PI * 2
    };

    geometries.push(mesh);
    scene.add(mesh);
  }

  // Animation state
  let isAnimating = true;
  let animationId = null;

  // Animation loop
  function animate() {
    if (!isAnimating) return;

    animationId = requestAnimationFrame(animate);

    // Smooth mouse interpolation
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    // Update particles
    const positions = particleGeometry.attributes.position.array;
    for (let i = 0; i < config.particleCount; i++) {
      positions[i * 3] += particleSpeeds[i].x + mouse.x * 0.02;
      positions[i * 3 + 1] += particleSpeeds[i].y + mouse.y * 0.02;
      positions[i * 3 + 2] += particleSpeeds[i].z;

      // Wrap particles around bounds
      if (positions[i * 3] > 30) positions[i * 3] = -30;
      if (positions[i * 3] < -30) positions[i * 3] = 30;
      if (positions[i * 3 + 1] > 30) positions[i * 3 + 1] = -30;
      if (positions[i * 3 + 1] < -30) positions[i * 3 + 1] = 30;
      if (positions[i * 3 + 2] > 15) positions[i * 3 + 2] = -15;
      if (positions[i * 3 + 2] < -15) positions[i * 3 + 2] = 15;
    }
    particleGeometry.attributes.position.needsUpdate = true;

    // Update geometries
    const time = Date.now() * 0.001;
    geometries.forEach(mesh => {
      mesh.rotation.x += mesh.userData.rotationSpeed.x + mouse.y * 0.003;
      mesh.rotation.y += mesh.userData.rotationSpeed.y + mouse.x * 0.003;
      mesh.rotation.z += mesh.userData.rotationSpeed.z;

      // Gentle floating motion
      mesh.position.y += Math.sin(time * mesh.userData.floatSpeed + mesh.userData.floatOffset) * 0.005;
    });

    renderer.render(scene, camera);
  }

  // Start/stop animation based on visibility
  function checkVisibility() {
    const introSection = document.getElementById('intro');
    if (!introSection) return;

    const rect = introSection.getBoundingClientRect();
    const isVisible = rect.bottom > 0 && rect.top < window.innerHeight;

    if (isVisible && !isAnimating) {
      isAnimating = true;
      animate();
    } else if (!isVisible && isAnimating) {
      isAnimating = false;
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    }
  }

  // Handle visibility change
  function handleVisibilityChange() {
    if (document.hidden) {
      isAnimating = false;
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    } else {
      checkVisibility();
    }
  }

  // Handle resize
  function handleResize() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  // Handle mouse/touch movement
  function handleMouseMove(event) {
    mouse.targetX = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.targetY = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  function handleTouchMove(event) {
    if (event.touches.length > 0) {
      mouse.targetX = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
      mouse.targetY = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
    }
  }

  // Event listeners
  window.addEventListener('resize', handleResize);
  window.addEventListener('scroll', checkVisibility);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('touchmove', handleTouchMove, { passive: true });

  // Start animation
  animate();
})();
