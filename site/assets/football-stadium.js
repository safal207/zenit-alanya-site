(function(root) {
  'use strict';

  function create(B, scene) {
    const turfColors = ['#356c36', '#3d773d'];
    const turf = scene.meshes.filter(mesh => mesh.name === 'pitch' || mesh.name === 'mown-stripe');
    turf.forEach((mesh, index) => {
      const material = mesh.material;
      material.diffuseColor = B.Color3.FromHexString(turfColors[index % 2]).toLinearSpace();
      material.specularColor = B.Color3.Black();
      material.ambientColor = B.Color3.Black();
      material.emissiveColor = B.Color3.Black();
      mesh.receiveShadows = true;
    });

    function material(name, color) {
      const result = new B.StandardMaterial(name, scene);
      result.diffuseColor = B.Color3.FromHexString(color).toLinearSpace();
      result.specularColor = B.Color3.Black();
      return result;
    }

    // Eight shared meshes render the entire seated crowd.
    const shirts = ['#1997cc', '#e7eef2', '#e3a454'].map((color, index) => {
      const mesh = B.MeshBuilder.CreateBox('crowd-shirt-' + index, {width:.27, height:.55, depth:.48}, scene);
      mesh.material = material('crowd-shirt-material-' + index, color);
      return mesh;
    });
    const heads = ['#d9a177', '#b8754c', '#79533c'].map((color, index) => {
      const mesh = B.MeshBuilder.CreateSphere('crowd-head-' + index, {diameter:.29, segments:6}, scene);
      mesh.material = material('crowd-skin-' + index, color);
      return mesh;
    });
    const thighs = B.MeshBuilder.CreateBox('crowd-thighs', {width:.40, height:.17, depth:.38}, scene);
    const legs = B.MeshBuilder.CreateBox('crowd-calves', {width:.13, height:.48, depth:.13}, scene);
    thighs.material = legs.material = material('crowd-trousers', '#1d2d41');
    const batches = [...shirts, ...heads, thighs, legs];
    const transforms = batches.map(() => []);
    function seatPart(batch, x, y, z) {
      transforms[batch].push(...B.Matrix.Translation(x, y, z).asArray());
    }
    for (const side of [-1, 1]) {
      for (let row = 0; row < 5; row++) {
        for (let seat = 0; seat < 19; seat++) {
          const x = side * (18.8 + row * .9);
          const z = -27 + seat * 3;
          const y = .975 + row * .55;
          const shirt = (seat + row * 2 + (side === 1 ? 1 : 0)) % shirts.length;
          const skin = (seat * 2 + row) % heads.length;
          seatPart(shirt, x, y + .35, z);
          seatPart(3 + skin, x, y + .79, z);
          seatPart(6, x - side * .21, y + .04, z);
          seatPart(7, x - side * .38, y - .21, z - .13);
          seatPart(7, x - side * .38, y - .21, z + .13);
        }
      }
    }
    batches.forEach((mesh, index) => {
      mesh.isPickable = false;
      mesh.receiveShadows = false;
      mesh.thinInstanceSetBuffer('matrix', new Float32Array(transforms[index]), 16, true);
    });

    const brand = scene.getMeshByName('club-sign');
    if (brand) {
      brand.position.set(-7.4, 5.2, 31.5);
      brand.scaling.setAll(.45);
      brand.rotation.set(0, 0, 0);
      brand.billboardMode = B.Mesh.BILLBOARDMODE_Y;
      brand.isPickable = false;
      brand.material.backFaceCulling = true;
      brand.material.disableLighting = true;
      brand.material.emissiveColor = B.Color3.White();
    }

    // The canvas texture is only needed in a rendering browser.
    if (typeof document === 'undefined' || typeof document.createElement !== 'function') {
      return {update() {}};
    }
    const texture = new B.DynamicTexture('stadium-score-text', {width:1024, height:320}, scene, false);
    const context = texture.getContext();
    const board = B.MeshBuilder.CreatePlane('stadium-scoreboard', {width:11, height:3.44}, scene);
    board.position.set(.5, 5.2, 31.5);
    board.billboardMode = B.Mesh.BILLBOARDMODE_Y;
    board.isPickable = false;
    const boardMaterial = new B.StandardMaterial('stadium-scoreboard-material', scene);
    boardMaterial.diffuseTexture = texture;
    boardMaterial.emissiveColor = B.Color3.White();
    boardMaterial.disableLighting = true;
    boardMaterial.backFaceCulling = true;
    board.material = boardMaterial;
    let previous = '';

    function update(scoreText, clockText, opponent) {
      const current = [scoreText, clockText, opponent].join('|');
      if (current === previous) return;
      previous = current;
      context.fillStyle = '#092536';
      context.fillRect(0, 0, 1024, 320);
      context.fillStyle = '#35b7e6';
      context.fillRect(0, 0, 1024, 9);
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.font = '700 30px Arial';
      context.fillStyle = '#e3f5fc';
      context.fillText('ZENIT ALANYA', 210, 92);
      context.fillText(String(opponent || 'GUESTS').slice(0, 18), 814, 92);
      context.font = '700 108px Arial';
      context.fillStyle = '#ffffff';
      context.fillText(String(scoreText || '0 : 0'), 512, 165);
      context.font = '700 34px Arial';
      context.fillStyle = '#c3ed85';
      context.fillText(String(clockText || '02:00'), 512, 268);
      texture.update(true);
    }
    update('0 : 0', '02:00', 'GUESTS');
    return {update};
  }

  const api = {create};
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FootballStadium = api;
})(typeof window === 'undefined' ? globalThis : window);
