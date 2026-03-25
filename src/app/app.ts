import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  HostListener,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import * as THREE from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements AfterViewInit {
  private platformId = inject(PLATFORM_ID);
  @ViewChild('sceneContainer', { static: true })
  containerRef!: ElementRef<HTMLDivElement>;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initThree();
      this.animate();
    }
  }

  @HostListener('window:resize')
  onResize() {
    const container = this.containerRef.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public onFileSelected(event: Event): void {
    const input: HTMLInputElement = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }
    const file: File = input.files[0];
    const url: string = URL.createObjectURL(file);
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf: GLTF) => {
        const model = gltf.scene;
        this.clearScene();
        this.scene.add(model);
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        const maxDim = Math.max(size.x, size.y, size.z);
        this.controls.target.set(0, 0, 0);
        const distance = maxDim * 1.2;
        this.camera.position.set(0, 0, distance);
        this.controls.minDistance = maxDim * 0.3;
        this.controls.maxDistance = maxDim * 10;
        this.controls.update();
        console.log('Model loaded from file');
      },
      undefined,
      (error: unknown) => {
        console.error('Error loading file:', error);
      },
    );
  }

  private clearScene() {
    this.scene.children = this.scene.children.filter((obj) => {
      return obj.type.includes('Light');
    });
  }

  private initThree(): void {
    const container: HTMLDivElement = this.containerRef.nativeElement;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f172a);
    const width: number = container.clientWidth;
    const height: number = container.clientHeight;

    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.z = 5;
    this.scene.add(new THREE.AmbientLight(0xffffff, 1));
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(
      this.camera,
      this.renderer.domElement
    );
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enablePan = true;
    this.controls.enableZoom = true;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 100;

    const geometry: THREE.BoxGeometry = new THREE.BoxGeometry();
    const material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
    const cube: THREE.Mesh = new THREE.Mesh(geometry, material);
    this.scene.add(cube);
  }

  private animate = () => {
    requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };
}
