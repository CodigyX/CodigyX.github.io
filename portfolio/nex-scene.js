/* Original procedural character. Three.js MIT license: vendor/three/LICENSE. */
(() => {
  window.createNexScene = function (stage) {
    if (!window.THREE) return null;
    const T = window.THREE;
    let renderer;
    try { renderer = new T.WebGLRenderer({ alpha: true, antialias: true }); }
    catch { return null; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    const canvas = renderer.domElement;
    canvas.className = 'nex-model';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Modelo 3D de Nex. Arrastra horizontalmente para ver sus lados y espalda.');
    stage.append(canvas);
    const scene = new T.Scene();
    // Local studio reflection map: no remote HDR textures or file:// fetches.
    const studio = new T.Scene(); studio.background = new T.Color(0x303344);
    const panels = [];
    for(const [color,intensity,pos,scale] of [
      [0xe5f0ff,4,[-4,5,3],[3,5,1]],
      [0xa797ff,2,[4,3,-3],[2,4,1]],
      [0xffe4bd,2,[0,7,0],[5,1,4]]
    ]) {
      const panel = new T.Mesh(new T.PlaneGeometry(...scale.slice(0,2)),new T.MeshBasicMaterial({color,side:T.DoubleSide}));
      panel.material.color.multiplyScalar(intensity);panel.position.set(...pos);panel.lookAt(0,2,0);studio.add(panel);panels.push(panel);
    }
    const pmrem = new T.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(studio,.12);scene.environment=environment.texture;
    pmrem.dispose();panels.forEach(p=>{p.geometry.dispose();p.material.dispose();});
    const camera = new T.PerspectiveCamera(34, 1, .1, 40);
    camera.position.set(0, 3.5, 10);
    camera.lookAt(0, 2, 0);
    scene.add(new T.HemisphereLight(0xd9e9ff, 0x292038, 1.5));
    const key = new T.DirectionalLight(0xffefd6, 3.2);
    key.position.set(-3, 7, 5); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.normalBias = .025;
    key.shadow.radius = 3;
    Object.assign(key.shadow.camera, { left: -4, right: 4, top: 6, bottom: -4 });
    key.shadow.bias = -.001;
    scene.add(key);
    const rim = new T.DirectionalLight(0x9b72ff, 3); rim.position.set(4, 4, -3); scene.add(rim);
    const fill = new T.DirectionalLight(0x91dfff,.8);fill.position.set(3,2,4);scene.add(fill);
    const material = (color, metalness = 0, roughness = .55, emissive = 0) => new T.MeshStandardMaterial({ color, metalness, roughness, emissive, emissiveIntensity: .65 });
    const m = { fur: material(0xc97624, 0, .82), cream: material(0xe9d8b3, 0, .85), dark: material(0x182335, .25, .55), silver: material(0x9faec2, .7, .4), gold: material(0xbc8835, .7, .38), purple: material(0x513899, .45, .4, 0x201039), cyan: material(0x60dcec, .3, .25, 0x168395), white: material(0xffffff), black: material(0x101520) };
    m.silver.envMapIntensity=.85;m.gold.envMapIntensity=1.1;
    m.silver.roughness=.3;m.gold.roughness=.28;
    m.fur.envMapIntensity=.25;m.cream.envMapIntensity=.3;m.dark.envMapIntensity=.45;
    const sphere = new T.SphereGeometry(1, 32, 24);
    function mesh(parent, geo, mat, p, s = [1, 1, 1]) {
      const o = new T.Mesh(geo, mat); o.position.set(...p); o.scale.set(...s);
      o.castShadow = true; o.receiveShadow = true; parent.add(o); return o;
    }
    const ellipsoid = (parent, mat, p, s) => mesh(parent, sphere, mat, p, s);
    function plate(parent, points, depth, mat, p) {
      const shape = new T.Shape(); points.forEach(([x, y], i) => i ? shape.lineTo(x, y) : shape.moveTo(x, y)); shape.closePath();
      return mesh(parent, new T.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: .035, bevelThickness: .035, bevelSegments: 3, steps: 1 }), mat, p);
    }
    function bone(parent, a, b, r1, r2, mat) {
      const av = new T.Vector3(...a), bv = new T.Vector3(...b), direction = bv.clone().sub(av);
      const o = mesh(parent, new T.CylinderGeometry(r2, r1, direction.length(), 12), mat, av.clone().add(bv).multiplyScalar(.5).toArray());
      o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), direction.normalize()); return o;
    }
    // The platform belongs to the scene, never to the rotating character group.
    const platform = new T.Group(); scene.add(platform);
    mesh(platform, new T.CylinderGeometry(2.23, 1.55, .66, 12), m.dark, [0, -.12, 0]);
    // Thick raised annular rim leaves the blue floor recessed, not covered.
    const rimProfile=[[1.65,.23],[1.7,.43],[2.12,.48],[2.32,.31],[2.2,.05],[1.72,.08],[1.65,.23]].map(([x,y])=>new T.Vector2(x,y));
    mesh(platform,new T.LatheGeometry(rimProfile,12),material(0x344154,.55,.6),[0,0,0]);
    mesh(platform, new T.CylinderGeometry(1.65, 1.65, .05, 64), material(0x073b87, .55, .3, 0x075cce), [0,.25,0]);
    const energyRing = mesh(platform, new T.TorusGeometry(1.59, .045, 8, 64), m.cyan, [0,.29,0]); energyRing.rotation.x = Math.PI/2;
    const coreRing = mesh(platform, new T.TorusGeometry(1.12, .012, 6, 64), m.cyan, [0,.272,0]); coreRing.rotation.x = Math.PI/2;
    const crest = plate(platform, [[0,.77],[.18,.21],[.63,.36],[.32,-.03],[.48,-.49],[0,-.27],[-.48,-.49],[-.32,-.03],[-.63,.36],[-.18,.21]], .012, m.gold, [0,.29,0]); crest.rotation.x=-Math.PI/2;
    for(let i=0;i<8;i++) {
      const fin=plate(platform,[[-.2,0],[.2,0],[.32,.18],[0,.48],[-.32,.18]],.12,m.dark,[0,.15,0]);
      fin.rotation.x=-Math.PI/2; fin.rotation.z=i*Math.PI/4;
      fin.position.x=Math.sin(i*Math.PI/4)*2.13;fin.position.z=Math.cos(i*Math.PI/4)*2.13;fin.position.y=.4;
    }
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6;
      const o = mesh(platform, new T.BoxGeometry(.34, .045, .09), i % 3 ? m.dark : m.purple, [Math.sin(a) * 2.06, .46, Math.cos(a) * 2.06]); o.rotation.y = a;
    }
    const character = new T.Group(); character.rotation.y = -.3; scene.add(character);
    const models = [];
    for (let form = 0; form < 3; form++) {
      const g = new T.Group(); character.add(g); models.push(g); g.visible = form === 0;
      if(form===0) {
        // Stage-one sculpt: continuous colored surfaces and tapered swept volumes.
        // Materials are private to this form; the two evolved forms are unaffected.
        const orange=new T.Color(0xd98529), ivory=new T.Color(0xffedca), burnt=new T.Color(0x733b25);
        const coat=new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.5,metalness:0,envMapIntensity:.4});
        const soft=material(0xffe8be,0,.65), noseMat=material(0x171c29,.05,.24);
        const irisMat=new T.MeshPhysicalMaterial({color:0x169fba,roughness:.22,metalness:.12,clearcoat:1,clearcoatRoughness:.12});
        const eyeMat=new T.MeshPhysicalMaterial({color:0xfff5df,roughness:.2,clearcoat:1});
        const pupilMat=material(0x070f21,0,.13);
        const smooth=(a,b,x)=>T.MathUtils.smoothstep(x,a,b);
        function sculpt(pos,scale,deform,paint){
          const geometry=new T.SphereGeometry(1,56,40),p=geometry.attributes.position,colors=[];
          for(let i=0;i<p.count;i++){
            const v=new T.Vector3().fromBufferAttribute(p,i);deform(v);p.setXYZ(i,v.x,v.y,v.z);
            const c=paint(v);colors.push(c.r,c.g,c.b);
          }
          geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
          return mesh(g,geometry,coat,pos,scale);
        }
        function sweep(points,width,depth,paint){
          const path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),count=48,sides=24;
          const frames=path.computeFrenetFrames(count,false),positions=[],colors=[],indices=[];
          for(let i=0;i<=count;i++){
            const t=i/count,center=path.getPointAt(t);
            for(let j=0;j<=sides;j++){
              const angle=j/sides*Math.PI*2,cs=Math.cos(angle),sn=Math.sin(angle);
              const v=center.clone().addScaledVector(frames.normals[i],cs*width(t)).addScaledVector(frames.binormals[i],sn*depth(t));
              positions.push(v.x,v.y,v.z);const c=paint(t,cs,sn,v);colors.push(c.r,c.g,c.b);
              if(i<count&&j<sides){const a=i*(sides+1)+j,b=a+sides+1;indices.push(a,a+1,b,b,a+1,b+1);}
            }
          }
          const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();
          return mesh(g,geometry,coat,[0,0,0]);
        }
        sculpt([0,1.03,-.035],[.52,.65,.43],v=>{v.x*=1-.22*v.y;v.z*=1-.1*v.y;},v=>{
          const bib=smooth(.28,.5,v.z)*(1-smooth(.48,.66,Math.abs(v.x)));
          return orange.clone().lerp(ivory,bib).multiplyScalar(.89+.11*(v.y+1)/2);
        });
        sculpt([0,1.88,.045],[.62,.51,.48],v=>{
          v.x*=1-.13*v.y;v.z+=.09*Math.max(0,-v.y)*(1-Math.abs(v.x));
        },v=>orange.clone().lerp(ivory,smooth(.2,.6,v.z)*(1-smooth(-.52,-.3,v.y))));
        // One tapered muzzle instead of paired round cheek pads.
        sculpt([0,1.68,.45],[.33,.19,.3],v=>{v.x*=1-.25*Math.max(0,v.z);},()=>ivory.clone());
        ellipsoid(g,noseMat,[0,1.74,.735],[.084,.053,.05]);
        const mouthCurve=new T.CatmullRomCurve3([new T.Vector3(-.13,1.573,.635),new T.Vector3(0,1.55,.679),new T.Vector3(.13,1.573,.635)]);
        mesh(g,new T.TubeGeometry(mouthCurve,20,.009,6,false),noseMat,[0,0,0]);
        for(const side of [-1,1]){
          // Organic cupped ears with painted inner fur and dark extremities.
          sweep([[side*.4,2.12,-.055],[side*.64,2.34,-.07],[side*.86,2.63,-.09],[side*.98,2.82,-.16]],
            t=>.015+.23*Math.pow(Math.sin(Math.PI*t),.8),t=>.008+.105*Math.sin(Math.PI*t),
            (t,cs,sn,v)=>orange.clone().lerp(ivory,smooth(.03,.1,v.z+.08)*(1-smooth(.78,.94,t))*smooth(.1,.28,t)).lerp(burnt,smooth(.82,1,t)));
          // Rounded cheek tufts, feet and toes are volumetric, visible in profile.
          sweep([[side*.44,1.68,.2],[side*.6,1.66,.24],[side*.76,1.7,.19]],t=>.12*(1-t)+.001,t=>.11*(1-t)+.001,()=>ivory.clone());
          sculpt([side*.32,.435,.18],[.25,.175,.35],v=>{v.z+=.1*(1-v.y*v.y);},v=>orange.clone().lerp(ivory,smooth(.6,.86,v.z)));
          for(let toe=-1;toe<=1;toe++)ellipsoid(g,soft,[side*.32+toe*.11,.405,.48],[.047,.044,.075]);
          sweep([[side*.43,1.28,.015],[side*.57,1.06,.045],[side*.57,.84,.15]],t=>.13+.025*Math.sin(Math.PI*t),t=>.12+.02*Math.sin(Math.PI*t),t=>orange.clone().lerp(ivory,smooth(.74,1,t)));
          ellipsoid(g,soft,[side*.57,.81,.14],[.14,.12,.13]);
          const eye=new T.Group();eye.position.set(side*.265,1.93,.428);eye.rotation.y=side*.22;eye.rotation.z=side*.09;eye.scale.set(.94,.84,1);g.add(eye);
          ellipsoid(eye,noseMat,[0,0,0],[.181,.206,.071]);
          ellipsoid(eye,eyeMat,[0,0,.036],[.159,.18,.052]);
          ellipsoid(eye,irisMat,[-side*.012,-.005,.074],[.117,.15,.037]);
          ellipsoid(eye,pupilMat,[-side*.012,-.005,.106],[.046,.105,.019]);
          ellipsoid(eye,m.white,[-.027,.067,.124],[.028,.038,.01]);
          ellipsoid(eye,m.white,[.034,-.053,.122],[.012,.017,.007]);
          sweep([[side*.1,2.06,.43],[side*.25,2.11,.452],[side*.41,2.13,.367]],t=>.032*Math.sin(Math.PI*t)+.004,t=>.037*Math.sin(Math.PI*t)+.003,()=>orange.clone().multiplyScalar(.7));
        }
        // Continuous curled fox tail with a cream tip, no disconnected spheres.
        sweep([[0,.68,-.29],[.44,.71,-.63],[.83,1.05,-.69],[.9,1.47,-.57],[.74,1.76,-.5]],
          t=>.035+.28*Math.pow(Math.sin(Math.PI*t),.8),t=>.018+.25*Math.sin(Math.PI*t),
          t=>orange.clone().lerp(ivory,smooth(.66,.76,t)));
        // Short swept crest keeps the same orange fox identity from every angle.
        for(let i=0;i<3;i++)sweep([[(i-1)*.105,2.26,0],[(i-1)*.13,2.42,-.05],[(i-1)*.15+.07,2.52,-.16]],t=>.065*(1-t)+.001,t=>.055*(1-t)+.001,()=>orange.clone());
        mesh(g,new T.OctahedronGeometry(.085),m.cyan,[0,1.4,.388],[.7,1,.45]).castShadow=false;
        continue;
      }
      const tall = form * .22, hip = 1.35 + tall, chest = 2.18 + tall, head = 3.03 + tall;
      // Distinct silhouettes: compact scout, broad armored defender, tall celestial knight.
      g.scale.set(form===1?1.15:1,form===0?.9:1,form===1?1.12:1);
      g.position.y=form===0?.03:0;
      ellipsoid(g, m.dark, [0, chest-.08, 0], [.49, .66, .32]);
      ellipsoid(g, m.dark, [0, hip, 0], [.38, .25, .28]);
      plate(g, [[-.42,.14],[.42,.14],[.34,-.07],[-.34,-.07]], .15, m.silver, [0,hip+.1,.21]);
      plate(g, [[0,.12],[.13,0],[0,-.12],[-.13,0]], .05, m.gold, [0,hip+.13,.4]);
      for(let i=0;i<3;i++) plate(g,[[-.29,.09],[.29,.09],[.24,-.08],[-.24,-.08]],.12,m.silver,[0,hip+.4+i*.18,.26]);
      for (const side of [-1, 1]) {
        bone(g, [side * .27, hip, 0], [side * .4, .57, .1], .2, .17, m.fur);
        plate(g,[[-.18,.34],[.16,.34],[.21,.08],[.13,-.32],[-.15,-.32],[-.2,.05]],.22,m.silver,[side*.4,.75,.09]);
        plate(g,[[0,.16],[.16,0],[0,-.15],[-.16,0]],.09,m.gold,[side*.38,1.03,.32]);
        ellipsoid(g, m.dark, [side * .4, .36, .29], [.25, .15, .4]);
        for (let j = -1; j <= 1; j++) mesh(g, new T.ConeGeometry(.065, .22, 8), m.cream, [side * .35 + j * .13, .34, .61]).rotation.x = Math.PI / 2;
        const shoulder = plate(g,[[-.29,.12],[0,.3],[.32,.13],[.37,-.12],[.09,-.23],[-.28,-.11]],.43,m.silver,[side*.61,chest+.14,-.2]); shoulder.rotation.z=-side*.17;
        plate(g,[[-.23,.1],[0,.24],[.24,.1],[.2,.04],[0,.15],[-.2,.03]],.05,form?m.gold:m.dark,[side*.61,chest+.2,.28]);
        bone(g, [side * .66, chest + .1, 0], [side * .82, hip + .22, .1], .2, .22, m.fur);
        plate(g,[[-.2,.28],[.18,.28],[.24,-.16],[0,-.3],[-.21,-.16]],.32,m.silver,[side*.81,hip+.38,-.02]);
        plate(g,[[0,.18],[.07,0],[0,-.17],[-.07,0]],.04,m.cyan,[side*.81,hip+.38,.34]);
        ellipsoid(g, m.dark, [side * .84, hip + .04, .14], [.22, .2, .23]);
        for (let j = -1; j <= 1; j++) ellipsoid(g, m.cream, [side * .84 + j * .1, hip - .07, .3], [.04, .1, .06]);
      }
      plate(g, [[-.52,.23],[-.25,.36],[0,.23],[.25,.36],[.52,.23],[.38,-.16],[0,-.34],[-.38,-.16]], .14, m.silver, [0, chest, .25]);
      for(const side of [-1,1]) plate(g,[[0,.08],[side*.41,.2],[side*.3,.07],[0,-.09]],.045,m.dark,[side*.05,chest+.05,.44]);
      plate(g, [[0,.19],[.12,0],[0,-.17],[-.12,0]], .08, m.gold, [0, chest + .02, .45]);
      plate(g, [[0,.13],[.075,0],[0,-.11],[-.075,0]], .035, m.cyan, [0, chest + .02, .56]);
      ellipsoid(g, m.silver, [0, chest, -.31], [.34, .5, .12]);
      for (let i = 0; i < 3; i++) ellipsoid(g, m.purple, [0, chest + .27 - i * .23, -.43], [.12, .075, .08]);
      ellipsoid(g, m.fur, [0, head, .02], [.48, .43, .38]);
      for (const side of [-1, 1]) {
        const ear = plate(g, [[-.16,0],[.15,0],[side * .17,.63]], .18, m.dark, [side * .3, head + .24, -.04]); ear.rotation.z = -side * .16;
        const inner = plate(g, [[-.1,.07],[.09,.07],[side * .12,.49]], .025, m.fur, [side * .3, head + .24, .18]); inner.rotation.z = -side * .16;
        plate(g,[[0,.12],[side*.26,.01],[side*.35,-.16],[side*.12,-.12],[0,-.24]],.13,m.cream,[side*.27,head-.12,.21]);
        const eye = ellipsoid(g, m.dark, [side * .205, head + .025, .35], [.16, .112, .065]); eye.rotation.z = side * .15;
        ellipsoid(g, m.cyan, [side * .205, head + .02, .404], [.065, .085, .025]);
        ellipsoid(g, m.black, [side * .205, head + .02, .424], [.025, .073, .014]);
        ellipsoid(g, m.white, [side * .205 - .018, head + .05, .439], [.015, .022, .008]);
        plate(g, [[0,-.02],[side*.32,.07],[side*.31,.15],[0,.06]], .07, m.dark, [side*.06, head + .11, .35]);
        plate(g,[[0,0],[side*.1,.25],[side*.25,.17],[side*.22,-.14]],.11,m.silver,[side*.3,head+.01,-.01]);
      }
      ellipsoid(g, m.cream, [0, head - .17, .39], [.22, .115, .25]);
      ellipsoid(g, m.black, [0, head - .11, .61], [.09, .052, .055]);
      plate(g,[[-.14,.01],[0,-.035],[.14,.01],[.1,-.025],[0,-.06],[-.1,-.025]],.02,m.dark,[0,head-.25,.53]);
      // Curved, tapering tail has real cross-sections and remains visible from behind.
      const tail = new T.CatmullRomCurve3([new T.Vector3(0,hip,-.22), new T.Vector3(.45,hip-.25,-.8), new T.Vector3(.9,hip+.05,-1.05), new T.Vector3(1.05,hip+.7,-.85)]);
      const frames = tail.computeFrenetFrames(32, false), vertices = [], indices = [];
      for (let i = 0; i <= 32; i++) {
        const t = i / 32, p = tail.getPointAt(t), radius = Math.max(.012, Math.sin(Math.PI * t) * .32 + (1-t)*.08);
        for (let j = 0; j < 12; j++) { const a = j / 12 * Math.PI * 2; const v = p.clone().addScaledVector(frames.normals[i], Math.cos(a)*radius).addScaledVector(frames.binormals[i], Math.sin(a)*radius); vertices.push(...v.toArray()); }
        if (i < 32) for(let j=0;j<12;j++){const a=i*12+j,b=i*12+(j+1)%12;indices.push(a,b,a+12,b,b+12,a+12);}
      }
      const tailGeo = new T.BufferGeometry(); tailGeo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));tailGeo.setIndex(indices);tailGeo.computeVertexNormals();
      tailGeo.addGroup(0, 24*12*6, 0);tailGeo.addGroup(24*12*6,8*12*6,1);mesh(g,tailGeo,[m.fur,m.cream],[0,0,0]);
      if (form) for (const side of [-1,1]) {
        const wing = new T.Group(); wing.position.set(side*.25,chest+.12,-.35); wing.rotation.y=side*.22;g.add(wing);
        // Separate swept vanes give the silhouette depth from both front and back.
        for(let n=0;n<(form===2?5:3);n++) {
          const reach=(form===2?1.6:1.05)-n*.13;
          const points=[[0,0],[side*.22,-.06],[side*reach,.95-n*.1],[side*(reach-.12),1.12-n*.1],[side*.35,.36]];
          const vane=plate(wing,points,.11,m.silver,[side*n*.12,-n*.18,-n*.07]);
          vane.rotation.z=-side*n*.13;
          const inset=plate(vane,points.map(([x,y])=>[x*.86,y*.86]),.025,n%2?m.gold:m.purple,[side*.04,.03,.15]);
          bone(vane,[side*.18,.08,.21],[side*(reach-.15),.94-n*.1,.21],.018,.009,m.cyan);
        }
      }
      for(const side of [-1,1]) {
        // Layered shoulder and greave trim, fasteners and articulated knuckles.
        for(let j=0;j<3;j++) {
          plate(g,[[-.21,.08],[.2,.08],[.25,-.04],[-.23,-.04]],.075,j===0?m.gold:m.silver,[side*.62,chest+.14-j*.1,.29+j*.025]);
          ellipsoid(g,m.gold,[side*.4+(j-1)*.105,.95,.39],[.028,.028,.025]);
          ellipsoid(g,m.silver,[side*.84+(j-1)*.1,hip+.045,.34],[.043,.065,.04]);
        }
        bone(g,[side*.4,.49,.37],[side*.4,.89,.38],.022,.018,m.gold);
        plate(g,[[0,.18],[side*.11,.02],[side*.15,-.18],[0,-.06]],.09,m.gold,[side*.42,head+.06,.12]);
      }
      if(form===2) plate(g,[[0,.5],[.14,0],[0,-.08],[-.14,0]],.16,m.gold,[0,head+.42,.06]);
      if(form===1) {
        for(const side of [-1,1]) {
          plate(g,[[0,.1],[side*.48,.36],[side*.56,-.08],[side*.23,-.28]],.32,m.dark,[side*.63,chest+.24,-.1]);
          plate(g,[[-.27,.35],[.27,.35],[.33,-.1],[0,-.5],[-.33,-.1]],.16,m.silver,[side*.95,hip+.33,.3]);
          plate(g,[[0,.26],[.07,0],[0,-.27],[-.07,0]],.05,m.cyan,[side*.95,hip+.33,.5]);
        }
        plate(g,[[-.35,.04],[0,.26],[.35,.04],[.23,-.06],[0,.09],[-.23,-.06]],.12,m.silver,[0,head+.28,.2]);
      }
      if(form===2) {
        const ivory=material(0xe2e8f2,.4,.38);
        for(const side of [-1,1]) {
          const skirt=plate(g,[[0,.16],[side*.28,.1],[side*.42,-.78],[side*.06,-.61]],.1,ivory,[side*.27,hip+.12,.11]);skirt.rotation.y=side*.25;
          plate(g,[[-.2,.32],[.2,.32],[.24,.07],[0,-.32],[-.24,.07]],.09,ivory,[side*.4,.77,.33]);
          for(let j=0;j<4;j++) {
            const feather=plate(g,[[0,0],[side*.13,.08],[side*(.7-j*.08),1.2-j*.1],[side*.3,.55]],.07,ivory,[side*(.7+j*.18),chest+.03-j*.14,-.4]);
            feather.rotation.z=-side*.38;
          }
        }
        bone(g,[1.1,.38,.13],[1.1,3.28,.13],.045,.045,m.gold);
        mesh(g,new T.OctahedronGeometry(.23),m.cyan,[1.1,3.5,.13],[.65,1.5,.65]);
        const halo=mesh(g,new T.TorusGeometry(.39,.025,8,48),m.gold,[0,head+.65,0]);halo.rotation.x=Math.PI/2;
      }
    }
    // World-space effects surround the rotating mesh; the pedestal never rotates.
    const effects=new T.Group();scene.add(effects);effects.visible=false;
    const glow=(color,opacity)=>new T.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide});
    const blue=glow(0x27baff,.75),white=glow(0xbcecff,.8);
    const orbit=mesh(effects,new T.TorusGeometry(2,.035,8,96),white,[0,2.2,0]);
    const orbitGlow=mesh(orbit,new T.TorusGeometry(2,.14,8,96),glow(0x348aff,.15),[0,0,0]);
    const rising=mesh(effects,new T.TorusGeometry(1.5,.04,8,96),blue,[0,.3,0]);rising.rotation.x=Math.PI/2;
    const veilMat=glow(0x56bfff,0);
    const veil=mesh(effects,new T.CylinderGeometry(1.15,1.4,4.7,48,1,true),veilMat,[0,2.45,0]);
    const trails=[];
    for(let j=0;j<3;j++) {
      const points=[];for(let i=0;i<=80;i++){const t=i/80,a=t*Math.PI*3+j*Math.PI*2/3;points.push(new T.Vector3(Math.cos(a)*1.32,.3+t*4.3,Math.sin(a)*1.32));}
      trails.push(mesh(effects,new T.TubeGeometry(new T.CatmullRomCurve3(points),80,.018,5,false),blue,[0,0,0]));
    }
    const sparks=[];for(let i=0;i<36;i++)sparks.push(mesh(effects,new T.OctahedronGeometry(.026),white,[0,0,0]));
    function clearEffects(){effects.visible=false;character.position.y=0;veilMat.opacity=0;}
    let frame = 0, finish = null, disposed = false, pointer = null;
    function draw(){ if(!disposed) { renderer.render(scene,camera); canvas.dataset.angle=String(Math.round(character.rotation.y*180/Math.PI)); } }
    function resize(){const {width,height}=stage.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.position.z=Math.max(10,6.2/camera.aspect);camera.updateProjectionMatrix();draw();}
    function cancel(){cancelAnimationFrame(frame);frame=0;clearEffects();draw();if(finish){const done=finish;finish=null;done(false);} }
    const observer=new ResizeObserver(resize);observer.observe(stage);
    canvas.addEventListener('pointerdown',e=>{if(stage.getAttribute('aria-busy')==='true')return;pointer={id:e.pointerId,x:e.clientX,angle:character.rotation.y};canvas.setPointerCapture(e.pointerId);});
    canvas.addEventListener('pointermove',e=>{if(pointer&&pointer.id===e.pointerId){character.rotation.y=pointer.angle+(e.clientX-pointer.x)*.018;draw();}});
    const release=()=>{pointer=null;};canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
    const api = {
      setForm(index){models.forEach((g,i)=>g.visible=i===index);draw();},
      cancel,
      evolve(index,onReveal){
        cancel();effects.visible=true;
        return new Promise(resolve=>{
          finish=resolve;const start=performance.now(),angle=character.rotation.y;let revealed=false;
          function tick(now){
            const t=Math.min(1,(now-start)/2600),envelope=Math.sin(Math.PI*t);
            character.rotation.y=angle+Math.PI*4*(t*t*(3-2*t));character.position.y=envelope*.18;
            orbit.rotation.y=t*Math.PI*2;orbit.rotation.z=Math.sin(t*Math.PI)*.3;
            rising.position.y=.3+t*4.2;rising.scale.setScalar(.8+envelope*.4);
            trails.forEach((o,i)=>{o.rotation.y=t*Math.PI*4+i*.2;});
            blue.opacity=envelope*.8;white.opacity=envelope*.9;
            veilMat.opacity=Math.pow(Math.sin(Math.PI*t),12)*.9;
            sparks.forEach((o,i)=>{const a=i*2.4+t*9,y=(i/36*4.5+t*3)%4.5;o.position.set(Math.cos(a)*(1.35+.2*Math.sin(i)),.3+y,Math.sin(a)*1.35);});
            if(t>=.5&&!revealed){revealed=true;models.forEach((g,i)=>g.visible=i===index);onReveal();}
            draw();
            if(t<1)frame=requestAnimationFrame(tick);else{clearEffects();character.rotation.y=angle;draw();finish=null;resolve(true);}
          }
          frame=requestAnimationFrame(tick);
        });
      },
      spin(duration){cancel();return new Promise(resolve=>{finish=resolve;const start=performance.now(),angle=character.rotation.y;function tick(now){const t=Math.min(1,(now-start)/duration);character.rotation.y=angle+Math.PI*2*(t*t*(3-2*t));draw();if(t<1)frame=requestAnimationFrame(tick);else{character.rotation.y%=Math.PI*2;finish=null;resolve(true);}}frame=requestAnimationFrame(tick);});},
      dispose(){cancel();disposed=true;observer.disconnect();const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());environment.dispose();renderer.dispose();}
    };
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancel();stage.classList.remove('has-3d');stage.dispatchEvent(new Event('nex-renderer-lost'));});
    stage.classList.add('has-3d');resize();return api;
  };
})();
