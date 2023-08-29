import Animation from 'Animation';
import Fonts from 'Fonts';
import Materials from 'Materials';
import Patches from 'Patches';
import Reactive from 'Reactive';
import Scene from 'Scene';
import Texture from 'Textures';
import Time from 'Time';
import TouchGestures from 'TouchGestures';

async function createFrame(
    name: string,
    canvas: Canvas,
    texture: TextureBase,
    point: PointSignal
): Promise<PlanarImage> {
    const mat = await Materials.create("DefaultMaterial", {
        "name": name,
        "blendMode": "ALPHA",
        "opacity": 1.0,
        "diffuse": texture
    });
    const pos = Reactive.transform(
        point,
        Reactive.point(1,1,1),
        Reactive.quaternionIdentity(),
    );
    const frame = await Scene.create("PlanarImage", {
        "name": name,
        "transform": pos,
        "width": canvas.bounds.width.div(2),
        "height": canvas.bounds.height.div(2),
        "material": mat,
        "hidden": false,
    }) as PlanarImage;
    return frame;
}

function createAnimation(begin: number, end: number) {
    const driver = Animation.timeDriver({
        durationMilliseconds: 500,
        loopCount: 1,
        mirror: true
    });
    const sampler = Animation.samplers.easeInOutQuad(begin, end);
    const animate = Animation.animate(driver, sampler);
    return { animate, driver };
}

function scaleAnimation(frame: PlanarImage) {
    let animation = createAnimation(1, 0.9);
    frame.transform.scaleX = animation.animate;
    frame.transform.scaleY = animation.animate;
    animation.driver.start();
    Time.setTimeout(() => {
        animation = createAnimation(0.9, 1);
        frame.transform.scaleX = animation.animate;
        frame.transform.scaleY = animation.animate;
        animation.driver.start();
    }, 500);
}

async function opacityAnimation(frame: PlanarText, begin: number, end: number) {
    let animation = createAnimation(begin, end);
    const material = await frame.getMaterial();
    material.opacity = animation.animate;
    animation.driver.start();
}

;(async function () {  // Enables async/await in JS [part 1]

    await Patches.inputs.setBoolean('freezedFrame1', false);
    await Patches.inputs.setBoolean('freezedFrame2', false);
    await Patches.inputs.setBoolean('freezedFrame3', false);
    await Patches.inputs.setBoolean('freezedFrame4', false);

    // Get the Textures and Assets
    const focalDist = await Scene.root.findFirst('Focal Distance');
    const cameraTex = await Texture.findFirst('cameraTexture');
    const borderTex = await Texture.findFirst('Border');

    // Create new canvas for frame rectangles
    const canvas = await Scene.create("Canvas", {
        "name": "Canvas 1",
        "hidden": false,
    }) as Canvas;

    focalDist.addChild(canvas);

    // Creating Background (BG)
    const bgMaterial = await Materials.create("DefaultMaterial", {
        "name": "BG",
        "blendMode": "ALPHA",
        "opacity": 1.0,
        "diffuseColorFactor": Reactive.RGBA(0,0,0,1)
    });

    const bg = await Scene.create("PlanarImage", {
        "name": "BG",
        "width": canvas.bounds.width,
        "height": canvas.bounds.height,
        "material": bgMaterial,
        "hidden": false,
    }) as PlanarImage;

    canvas.addChild(bg);

    // Calculate screen horizontal and vertical point
    const mx = canvas.bounds.width.div(2);
    const my = canvas.bounds.height.div(2);

    // Create frames
    const frame1 = await createFrame("Booth 1", canvas, cameraTex, Reactive.point(0,0,0));
    const frame2 = await createFrame("Booth 2", canvas, cameraTex, Reactive.point(mx,0,0));
    const frame3 = await createFrame("Booth 3", canvas, cameraTex, Reactive.point(0,my,0));
    const frame4 = await createFrame("Booth 4", canvas, cameraTex, Reactive.point(mx,my,0));

    // Adding frames to the canvas
    canvas.addChild(frame1);
    canvas.addChild(frame2);
    canvas.addChild(frame3);
    canvas.addChild(frame4);

    // Adding frame border
    const borderMat = await Materials.create("DefaultMaterial", {
        "name": "Border",
        "blendMode": "ALPHA",
        "opacity": 1.0,
        "diffuse": borderTex,
        "diffuseColorFactor": Reactive.RGBA(0,0,0,1),
    });

    const border = await Scene.create("PlanarImage", {
        "name": "Border",
        "width": canvas.bounds.width,
        "height": canvas.bounds.height,
        "hidden": false,
        "material": borderMat,
    });

    canvas.addChild(border);

    // Adding Help Text
    const fonts = await Fonts.getAll();
    const textMat = await Materials.findFirst("HelpText");
    const helpText = await Scene.create("PlanarText", {
        "name": "Help Text",
        "text": "Tap to Capture",
        "width": canvas.bounds.width,
        "height": canvas.bounds.height,
        "font": fonts[0],
        "fontSize": 72,
        "scaleToFit": false,
        "maxLines": 2,
        "tracking": -1,
        "leading": 0,
        "material": textMat,
        "hidden": false
    }) as PlanarText;

    helpText.alignment.horizontal = Scene.TextAlignment.CENTER;
    helpText.alignment.vertical = Scene.VerticalAlignment.CENTER;

    canvas.addChild(helpText);

    // Add interactivity
    let touchCounter = 0;
    TouchGestures.onTap().subscribe(async () => {
        touchCounter++;
        if (touchCounter === 1) {
            await opacityAnimation(helpText, 1, 0);
            await Patches.inputs.setBoolean('freezedFrame1', true);
            frame1.material = await Materials.findFirst('FreezedFrame1');
            scaleAnimation(frame1);
        } else if (touchCounter === 2) {
            await Patches.inputs.setBoolean('freezedFrame2', true);
            frame2.material = await Materials.findFirst('FreezedFrame2');
            scaleAnimation(frame2);
        } else if (touchCounter === 3) {
            await Patches.inputs.setBoolean('freezedFrame3', true);
            frame3.material = await Materials.findFirst('FreezedFrame3');
            scaleAnimation(frame3);
        } else if (touchCounter === 4) {
            await Patches.inputs.setBoolean('freezedFrame4', true);
            frame4.material = await Materials.findFirst('FreezedFrame4');
            scaleAnimation(frame4);
        }
    });

    TouchGestures.onLongPress().subscribe(async () => {
        touchCounter = 0;
        await opacityAnimation(helpText, 0, 1);
        await Patches.inputs.setBoolean('freezedFrame1', false);
        await Patches.inputs.setBoolean('freezedFrame2', false);
        await Patches.inputs.setBoolean('freezedFrame3', false);
        await Patches.inputs.setBoolean('freezedFrame4', false);
    });

})(); // Enables async/await in JS [part 2]
