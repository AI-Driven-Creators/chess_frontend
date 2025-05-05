/**
 * Billboard Script
 * 
 * Makes an entity always face the camera.
 */

var Billboard = pc.createScript('billboard');

// initialize code called once per entity
Billboard.prototype.initialize = function() {
    this.camera = this.app.root.findByName('Camera');
    
    if (this.camera && this.camera.camera) {
        // Use the provided camera if available
    } else {
        // Find the first camera in the scene
        var cameras = this.app.root.findComponents('camera');
        if (cameras.length > 0) {
            this.camera = cameras[0].entity;
        }
    }
    
    if (!this.camera) {
        console.error('Billboard script: No camera found');
    }
};

// update code called every frame
Billboard.prototype.update = function(dt) {
    if (this.camera) {
        // Get the camera's position
        var cameraPos = this.camera.getPosition();
        
        // Make the entity look at the camera
        this.entity.lookAt(cameraPos);
    }
};

// Expose the camera property to the editor
Billboard.attributes.add('camera', {
    type: 'entity',
    title: 'Camera',
    description: 'The camera the entity should face. If not set, the script will try to find a camera in the scene.'
});