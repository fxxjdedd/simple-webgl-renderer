import { Geometry, Material, Mesh } from "../core/core";
import { WebGLRenderTarget } from "../core/renderTarget";
import { ScreenPlane } from "../geometry/ScreenPlane";
import { DeferredMaterial } from "../materials";

interface MeshDef {
    geometry: Geometry;
    material: Material;
}

export class GL_Deferred {
    deferredMeshes = new Map<Mesh, MeshDef>();
    batchedForwardMeshes: MeshDef[] = [];

    gBufferRenderTarget: WebGLRenderTarget;

    get gBuffer() {
        const rtt = this.gBufferRenderTarget;
        // debug
        rtt.textures[0].url = "diffuse";
        rtt.textures[1].url = "normal";
        rtt.textures[2].url = "depth";
        return {
            diffuse: rtt.textures[0],
            normal: rtt.textures[1],
            depth: rtt.textures[2],
        };
    }

    constructor(rtt: WebGLRenderTarget) {
        this.gBufferRenderTarget = rtt;
    }

    setupMeshes(meshes: Mesh[]) {
        this.deferredMeshes.clear();
        this.batchedForwardMeshes = [];

        const deferredGeometry = new ScreenPlane();

        const materialCache = {};

        for (const mesh of meshes) {
            const deferredMaterial = new DeferredMaterial();
            deferredMaterial.blending.enabled = false;
            deferredMaterial.uniforms = mesh.material.uniforms;
            this.deferredMeshes.set(mesh, {
                geometry: mesh.geometry,
                material: deferredMaterial,
            });

            if (!materialCache[mesh.material.name]) {
                materialCache[mesh.material.name] = true;

                this.batchedForwardMeshes.push({
                    geometry: deferredGeometry,
                    material: mesh.material,
                });
            }
        }
    }
}
