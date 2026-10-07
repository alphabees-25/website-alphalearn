export const MINI_ORBI_SIZES = Object.freeze([58, 66, 54, 70, 57, 64, 55]);
export const MINI_MERGE_IMPACTS = Object.freeze([.89, .85, .81, .79, .83, .87, .91]);
export const MINI_SPLIT_RELEASES = Object.freeze([.104, .127, .110, .140, .118, .114, .133]);
export const MINI_DISTRIBUTION_X = Object.freeze([-210, -142, -72, 12, 76, 146, 212]);
export const MINI_DISTRIBUTION_LOOP_DURATION = 4200;
export const MINI_AUTONOMOUS_STARTS = Object.freeze(MINI_SPLIT_RELEASES.map((release) => release + .119));

const MINI_PATHS = Object.freeze([
  { burstX: -76, burstY: -55, firstX: -210, hops: [[.32, -162, 72], [.46, -205, 94], [.59, -150, 58], [.69, -118, 82]], tilt: -1 },
  { burstX: -53, burstY: -82, firstX: -142, hops: [[.30, -112, 48], [.42, -78, 88], [.55, -132, 66], [.68, -68, 52]], tilt: 1 },
  { burstX: -28, burstY: -64, firstX: -72, hops: [[.35, -36, 106], [.50, -96, 48], [.64, -24, 80]], tilt: -1 },
  { burstX: 0, burstY: -102, firstX: 12, hops: [[.37, 46, 74], [.51, -16, 110], [.65, 32, 56]], tilt: 1 },
  { burstX: 30, burstY: -70, firstX: 76, hops: [[.33, 116, 86], [.47, 58, 54], [.58, 126, 104], [.69, 72, 62]], tilt: -1 },
  { burstX: 55, burstY: -86, firstX: 146, hops: [[.29, 112, 62], [.41, 180, 102], [.54, 132, 46], [.67, 194, 78]], tilt: 1 },
  { burstX: 78, burstY: -50, firstX: 212, hops: [[.34, 166, 92], [.48, 218, 60], [.60, 158, 112], [.69, 122, 68]], tilt: -1 },
]);

const transform = (x, y, rotation = 0, scaleX = 1, scaleY = 1) =>
  `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scaleX}, ${scaleY})`;

const shadowTransform = (x, scaleX = 1) => `translateX(${x}px) scaleX(${scaleX})`;

function buildMiniFrames(path, size, index, { merge = true } = {}) {
  const groundY = 94 - size / 2;
  const direction = path.tilt;
  const releaseTime = MINI_SPLIT_RELEASES[index];
  const radialAngle = Math.round(Math.atan2(path.burstY, path.burstX) * 180 / Math.PI);
  const neckTime = releaseTime + .008;
  const detachTime = releaseTime + .018;
  const burstTime = releaseTime + .030;
  const apexTime = releaseTime + .052;
  const fallTime = releaseTime + .076;
  const firstLandingTime = releaseTime + .105;
  const firstSettleTime = firstLandingTime + .014;
  const apexLift = 18 + (index % 3) * 5;
  const apexX = path.burstX + (path.firstX - path.burstX) * .28;
  const apexY = path.burstY - apexLift;
  const fallX = path.burstX + (path.firstX - path.burstX) * .58;
  const fallY = apexY + (groundY - apexY) * .20;
  const body = [
    { transform: transform(0, 0, 0, .08, .08), opacity: 0, offset: 0 },
    { transform: transform(0, 0, radialAngle, .08, .06), opacity: 0, offset: releaseTime - .006 },
    { transform: transform(path.burstX * .04, path.burstY * .04, radialAngle, .20, .11), opacity: .18, offset: releaseTime, easing: "cubic-bezier(.22,.72,.25,1)" },
    { transform: transform(path.burstX * .22, path.burstY * .22, radialAngle, .64, .26), opacity: .78, offset: neckTime, easing: "cubic-bezier(.12,.82,.2,1)" },
    { transform: transform(path.burstX * .58, path.burstY * .58, radialAngle * .45, 1.08, .64), opacity: 1, offset: detachTime, easing: "cubic-bezier(.18,.7,.22,1)" },
    { transform: transform(path.burstX, path.burstY, direction * 18, 1.16, .92), opacity: 1, offset: burstTime, easing: "cubic-bezier(.16,.72,.24,1)" },
    { transform: transform(apexX, apexY, direction * 10, .98, 1.02), opacity: 1, offset: apexTime, easing: "cubic-bezier(.4,0,.75,.35)" },
    { transform: transform(fallX, fallY, direction * 7, .96, 1.07), opacity: 1, offset: fallTime, easing: "cubic-bezier(.52,.02,.88,.48)" },
    { transform: transform(path.firstX, groundY, direction * 4, 1.18, .80), opacity: 1, offset: firstLandingTime, easing: "cubic-bezier(.12,.8,.22,1)" },
    { transform: transform(path.firstX, groundY, 0, 1, 1), opacity: 1, offset: firstSettleTime },
  ];
  const shadow = [
    { transform: shadowTransform(0, .15), opacity: 0, offset: 0 },
    { transform: shadowTransform(0, .15), opacity: 0, offset: burstTime },
    { transform: shadowTransform(apexX, .28), opacity: .035, offset: apexTime },
    { transform: shadowTransform(fallX, .52), opacity: .10, offset: fallTime },
    { transform: shadowTransform(path.firstX, 1.12), opacity: .25, offset: firstLandingTime },
    { transform: shadowTransform(path.firstX, 1), opacity: .2, offset: firstSettleTime },
  ];

  let previousTime = firstSettleTime;
  let previousX = path.firstX;
  path.hops.forEach(([landingTime, landingX, height], hopIndex) => {
    const takeoffTime = previousTime + Math.min(.025, (landingTime - previousTime) * .18);
    const apexTime = previousTime + (landingTime - previousTime) * (.46 + ((index + hopIndex) % 3) * .035);
    const apexX = previousX + (landingX - previousX) * (.48 + (hopIndex % 2) * .05);
    const spin = direction * (12 + ((index + hopIndex) % 3) * 7);

    body.push(
      { transform: transform(previousX, groundY - 8, -direction * 3, .91, 1.10), opacity: 1, offset: takeoffTime, easing: "cubic-bezier(.38,0,.72,.32)" },
      { transform: transform(apexX, groundY - height, spin, 1, 1), opacity: 1, offset: apexTime, easing: "cubic-bezier(.18,.68,.25,1)" },
      { transform: transform(landingX, groundY, direction * 3, 1.14, .84), opacity: 1, offset: landingTime },
    );
    shadow.push(
      { transform: shadowTransform(previousX, .82), opacity: .16, offset: takeoffTime },
      { transform: shadowTransform(apexX, .46), opacity: .08, offset: apexTime },
      { transform: shadowTransform(landingX, 1.10), opacity: .25, offset: landingTime },
    );

    const settleTime = Math.min(landingTime + .016, .706);
    if (settleTime > landingTime) {
      body.push({ transform: transform(landingX, groundY, 0, 1, 1), opacity: 1, offset: settleTime });
      shadow.push({ transform: shadowTransform(landingX, 1), opacity: .2, offset: settleTime });
    }
    previousTime = settleTime;
    previousX = landingX;
  });

  if (!merge) {
    const targetX = MINI_DISTRIBUTION_X[index];
    const fanDirection = Math.sign(targetX - previousX) || direction;
    const fanApexX = previousX + (targetX - previousX) * .54;
    body.push(
      { transform: transform(previousX, groundY - 7, -fanDirection * 3, .92, 1.09), opacity: 1, offset: .725, easing: "cubic-bezier(.38,0,.72,.32)" },
      { transform: transform(fanApexX, groundY - 48 - (index % 3) * 7, fanDirection * 11, 1, 1), opacity: 1, offset: .775, easing: "cubic-bezier(.18,.68,.25,1)" },
      { transform: transform(targetX, groundY, fanDirection * 2, 1.13, .85), opacity: 1, offset: .825 },
      { transform: transform(targetX, groundY, 0, 1, 1), opacity: 1, offset: .845 },
      { transform: transform(targetX, groundY, 0, 1, 1), opacity: 1, offset: 1 },
    );
    shadow.push(
      { transform: shadowTransform(previousX, .80), opacity: .15, offset: .725 },
      { transform: shadowTransform(fanApexX, .48), opacity: .08, offset: .775 },
      { transform: shadowTransform(targetX, 1.10), opacity: .25, offset: .825 },
      { transform: shadowTransform(targetX, 1), opacity: .2, offset: .845 },
      { transform: shadowTransform(targetX, 1), opacity: .2, offset: 1 },
    );
    return { body, shadow };
  }

  const impactTime = MINI_MERGE_IMPACTS[index];
  const stagingX = previousX * .43;
  const stagingY = -52 - (index % 3) * 12;
  const approachTime = impactTime - .028;
  const contactTime = impactTime - .009;
  const absorbedTime = impactTime + .012;

  body.push(
    { transform: transform(previousX, groundY - 8, -direction * 4, .90, 1.10), opacity: 1, offset: .725, easing: "cubic-bezier(.34,0,.58,1)" },
    { transform: transform(stagingX, stagingY, direction * 22, 1.04, .98), opacity: 1, offset: .76, easing: "cubic-bezier(.2,.72,.25,1)" },
    { transform: transform(stagingX * .42, stagingY * .45, -direction * 14, .90, 1.06), opacity: 1, offset: approachTime, easing: "cubic-bezier(.5,0,.82,.28)" },
    { transform: transform(direction * 7, -5, direction * 5, .70, .78), opacity: 1, offset: contactTime },
    { transform: transform(0, 0, 0, .42, .42), opacity: 1, offset: impactTime },
    { transform: transform(0, 0, 0, .035, .035), opacity: 0, offset: absorbedTime },
    { transform: transform(0, 0, 0, .035, .035), opacity: 0, offset: 1 },
  );
  shadow.push(
    { transform: shadowTransform(previousX, .76), opacity: .14, offset: .725 },
    { transform: shadowTransform(stagingX, .34), opacity: .055, offset: .76 },
    { transform: shadowTransform(stagingX * .42, .20), opacity: .025, offset: approachTime },
    { transform: shadowTransform(0, .10), opacity: 0, offset: impactTime },
    { transform: shadowTransform(0, .10), opacity: 0, offset: 1 },
  );

  return { body, shadow };
}

function createSparkFrames(index) {
  const angle = (Math.PI * 2 * index) / 12 - Math.PI / 2;
  const radius = 72 + (index % 3) * 16;
  const nearX = Math.cos(angle) * 18;
  const nearY = Math.sin(angle) * 18;
  const farX = Math.cos(angle) * radius;
  const farY = Math.sin(angle) * radius;
  const rotate = index * 31;
  const mergeImpact = MINI_MERGE_IMPACTS[index % MINI_MERGE_IMPACTS.length];
  const splitDelay = (index % 4) * .002;

  return [
    { transform: transform(0, 0, rotate, .2, .2), opacity: 0, offset: 0 },
    { transform: transform(0, 0, rotate, .2, .2), opacity: 0, offset: .101 + splitDelay },
    { transform: transform(nearX, nearY, rotate, 1, 1), opacity: .9, offset: .106 + splitDelay },
    { transform: transform(farX, farY, rotate + 65, .45, .45), opacity: 0, offset: .168 + splitDelay },
    { transform: transform(farX * .78, farY * .78, rotate + 90, .35, .35), opacity: 0, offset: .74 },
    { transform: transform(farX * .44, farY * .44, rotate + 130, .82, .82), opacity: .72, offset: mergeImpact - .032 },
    { transform: transform(0, 0, rotate + 180, .10, .10), opacity: 0, offset: mergeImpact + .006 },
    { transform: transform(0, 0, rotate + 180, .12, .12), opacity: 0, offset: 1 },
  ];
}

function createMainActorFrames() {
  const frames = [
    { transform: "translateY(0) scale(1, 1)", opacity: 1, offset: 0 },
    { transform: "translateY(7px) scale(1.12, .82)", opacity: 1, offset: .028, easing: "cubic-bezier(.4,0,.8,.45)" },
    { transform: "translateY(-7px) scale(.93, 1.15)", opacity: 1, offset: .048, easing: "cubic-bezier(.16,1,.3,1)" },
    { transform: "translateY(-5px) scale(1.08, 1.12)", opacity: 1, offset: .070 },
    { transform: "translateY(-2px) scale(1.25, 1.23)", opacity: 1, offset: .088, easing: "cubic-bezier(.12,.72,.2,1)" },
    { transform: "translateY(0) scale(1.38, 1.32)", opacity: 1, offset: .104 },
    { transform: "translateY(0) scale(1.38, 1.32)", opacity: 0, offset: .106 },
    { transform: "translateY(0) scale(.08, .08)", opacity: 0, offset: .765 },
    { transform: "translateY(0) scale(.08, .08)", opacity: .34, offset: .778 },
  ];
  const targetScales = [.22, .34, .46, .58, .70, .82, .94];
  [...MINI_MERGE_IMPACTS].sort((a, b) => a - b).forEach((impact, index) => {
    const target = targetScales[index];
    frames.push(
      { transform: `translateY(${index % 2 ? -1 : 1}px) scale(${target + .055}, ${target - .025})`, opacity: 1, offset: impact },
      { transform: `translateY(0) scale(${target}, ${target})`, opacity: 1, offset: impact + .012 },
    );
  });
  frames.push(
    { transform: "translateY(1px) scale(1.03, .97)", opacity: 1, offset: .93 },
    { transform: "translateY(0) scale(1, 1)", opacity: 1, offset: .95 },
    { transform: "translateY(0) scale(1, 1)", opacity: 1, offset: 1 },
  );
  return frames;
}

function createMainShadowFrames() {
  const frames = [
    { transform: "scaleX(1)", opacity: .28, offset: 0 },
    { transform: "scaleX(1.24)", opacity: .38, offset: .028 },
    { transform: "scaleX(.72)", opacity: .17, offset: .048 },
    { transform: "scaleX(1.08)", opacity: .27, offset: .070 },
    { transform: "scaleX(1.30)", opacity: .36, offset: .088 },
    { transform: "scaleX(1.42)", opacity: .40, offset: .104 },
    { transform: "scaleX(1.42)", opacity: 0, offset: .106 },
    { transform: "scaleX(.10)", opacity: 0, offset: .778 },
  ];
  [...MINI_MERGE_IMPACTS].sort((a, b) => a - b).forEach((impact, index) => {
    const progress = (index + 1) / MINI_MERGE_IMPACTS.length;
    frames.push(
      { transform: `scaleX(${(.14 + progress * .92).toFixed(3)})`, opacity: Number((.06 + progress * .20).toFixed(3)), offset: impact },
      { transform: `scaleX(${(.10 + progress * .82).toFixed(3)})`, opacity: Number((.04 + progress * .18).toFixed(3)), offset: impact + .012 },
    );
  });
  frames.push(
    { transform: "scaleX(1.24)", opacity: .36, offset: .93 },
    { transform: "scaleX(.91)", opacity: .25, offset: .956 },
    { transform: "scaleX(1.05)", opacity: .30, offset: .978 },
    { transform: "scaleX(1)", opacity: .28, offset: 1 },
  );
  return frames;
}

function createMainBlobFrames() {
  const frames = [
    { transform: "scale(1, 1) rotate(0deg)", offset: 0 },
    { transform: "scale(1, 1) rotate(0deg)", offset: .778 },
  ];
  [...MINI_MERGE_IMPACTS].sort((a, b) => a - b).forEach((impact, index) => {
    const horizontal = index % 2 === 0;
    frames.push(
      {
        transform: horizontal
          ? `scale(${1.16 - index * .008}, ${.88 + index * .006}) rotate(${index % 4 < 2 ? -2.4 : 2.4}deg)`
          : `scale(${.90 + index * .006}, ${1.14 - index * .008}) rotate(${index % 4 < 2 ? 2.1 : -2.1}deg)`,
        offset: impact,
      },
      { transform: "scale(.985, 1.018) rotate(0deg)", offset: impact + .012 },
    );
  });
  frames.push(
    { transform: "scale(1.20, .84) rotate(-2.8deg)", offset: .93, easing: "cubic-bezier(.15,.78,.24,1)" },
    { transform: "scale(.90, 1.14) rotate(2.1deg)", offset: .948 },
    { transform: "scale(1.09, .94) rotate(-1.35deg)", offset: .966 },
    { transform: "scale(.96, 1.055) rotate(.75deg)", offset: .981 },
    { transform: "scale(1.025, .985) rotate(-.3deg)", offset: .992 },
    { transform: "scale(1, 1) rotate(0deg)", offset: 1 },
  );
  return frames;
}

function createDistributedMainActorFrames() {
  const splitFrames = createMainActorFrames().filter(({ offset }) => offset <= .106);
  return [
    ...splitFrames,
    { transform: splitFrames.at(-1).transform, opacity: 0, offset: 1 },
  ];
}

function createDistributedMainShadowFrames() {
  const splitFrames = createMainShadowFrames().filter(({ offset }) => offset <= .106);
  return [
    ...splitFrames,
    { transform: splitFrames.at(-1).transform, opacity: 0, offset: 1 },
  ];
}

function createDistributedSparkFrames(index) {
  const splitFrames = createSparkFrames(index).filter(({ offset }) => offset < .2);
  return [
    ...splitFrames,
    { ...splitFrames.at(-1), offset: 1 },
  ];
}

const SPLIT_ONLY_RING_FRAMES = Object.freeze([
  { transform: "translate(-50%, -50%) scale(.18)", opacity: 0, offset: 0 },
  { transform: "translate(-50%, -50%) scale(.18)", opacity: 0, offset: .101 },
  { transform: "translate(-50%, -50%) scale(.46)", opacity: .84, offset: .106 },
  { transform: "translate(-50%, -50%) scale(1.45)", opacity: 0, offset: .168 },
  { transform: "translate(-50%, -50%) scale(1.45)", opacity: 0, offset: 1 },
]);

export function createSplitSwarmFrames() {
  return {
    mainActor: createMainActorFrames(),
    mainShadow: createMainShadowFrames(),
    mainBlob: createMainBlobFrames(),
    minis: MINI_PATHS.map((path, index) => buildMiniFrames(path, MINI_ORBI_SIZES[index], index)),
    burstRing: [
      { transform: "translate(-50%, -50%) scale(.18)", opacity: 0, offset: 0 },
      { transform: "translate(-50%, -50%) scale(.18)", opacity: 0, offset: .101 },
      { transform: "translate(-50%, -50%) scale(.46)", opacity: .84, offset: .106 },
      { transform: "translate(-50%, -50%) scale(1.45)", opacity: 0, offset: .168 },
      { transform: "translate(-50%, -50%) scale(1.45)", opacity: 0, offset: .75 },
      { transform: "translate(-50%, -50%) scale(.42)", opacity: .32, offset: .79 },
      { transform: "translate(-50%, -50%) scale(.72)", opacity: 0, offset: .815 },
      { transform: "translate(-50%, -50%) scale(.54)", opacity: .28, offset: .85 },
      { transform: "translate(-50%, -50%) scale(.90)", opacity: 0, offset: .875 },
      { transform: "translate(-50%, -50%) scale(.76)", opacity: .58, offset: .91 },
      { transform: "translate(-50%, -50%) scale(1.48)", opacity: 0, offset: .948 },
      { transform: "translate(-50%, -50%) scale(.12)", opacity: 0, offset: 1 },
    ],
    sparks: Array.from({ length: 12 }, (_, index) => createSparkFrames(index)),
  };
}

export function createSplitSwarmDistributeFrames() {
  return {
    mainActor: createDistributedMainActorFrames(),
    mainShadow: createDistributedMainShadowFrames(),
    mainBlob: [
      { transform: "scale(1, 1) rotate(0deg)", offset: 0 },
      { transform: "scale(1, 1) rotate(0deg)", offset: 1 },
    ],
    minis: MINI_PATHS.map((path, index) => buildMiniFrames(path, MINI_ORBI_SIZES[index], index, { merge: false })),
    burstRing: SPLIT_ONLY_RING_FRAMES.map((frame) => ({ ...frame })),
    sparks: Array.from({ length: 12 }, (_, index) => createDistributedSparkFrames(index)),
  };
}

export function createMiniSwarmWaitingLoopFrames(cycleIndex = 0) {
  return MINI_ORBI_SIZES.map((size, index) => {
    const path = MINI_PATHS[index];
    const homeX = MINI_DISTRIBUTION_X[index];
    const groundY = 94 - size / 2;
    const sourceStart = MINI_AUTONOMOUS_STARTS[index];
    const sourceEnd = .706;
    const source = buildMiniFrames(path, size, index);
    const remapOffset = (offset) => .02 + ((offset - sourceStart) / (sourceEnd - sourceStart)) * .76;
    const extractOriginalFrames = (frames) => frames
      .filter(({ offset }) => offset >= sourceStart && offset <= sourceEnd)
      .map((frame) => ({ ...frame, offset: remapOffset(frame.offset) }));
    const body = [
      { transform: transform(homeX, groundY, 0, 1, 1), opacity: 1, offset: 0 },
      ...extractOriginalFrames(source.body),
    ];
    const shadow = [
      { transform: shadowTransform(homeX, 1), opacity: .2, offset: 0 },
      ...extractOriginalFrames(source.shadow),
    ];

    if (body.at(-1).offset < .78) body.push({ ...body.at(-1), offset: .78 });
    if (shadow.at(-1).offset < .78) shadow.push({ ...shadow.at(-1), offset: .78 });

    const finalX = path.hops.at(-1)[1];
    const direction = Math.sign(homeX - finalX) || path.tilt;
    const returnHeight = Math.round(path.hops.at(-1)[2] * .78);
    const returnApexX = finalX + (homeX - finalX) * .52;
    body.push(
      { transform: transform(finalX, groundY - 7, -direction * 3, .91, 1.10), opacity: 1, offset: .805, easing: "cubic-bezier(.38,0,.72,.32)" },
      { transform: transform(returnApexX, groundY - returnHeight, direction * 12, 1, 1), opacity: 1, offset: .875, easing: "cubic-bezier(.18,.68,.25,1)" },
      { transform: transform(homeX, groundY, direction * 3, 1.14, .84), opacity: 1, offset: .955 },
      { transform: transform(homeX, groundY, 0, 1, 1), opacity: 1, offset: .978 },
      { transform: transform(homeX, groundY, 0, 1, 1), opacity: 1, offset: 1 },
    );
    shadow.push(
      { transform: shadowTransform(finalX, .82), opacity: .16, offset: .805 },
      { transform: shadowTransform(returnApexX, .46), opacity: .08, offset: .875 },
      { transform: shadowTransform(homeX, 1.10), opacity: .25, offset: .955 },
      { transform: shadowTransform(homeX, 1), opacity: .2, offset: .978 },
      { transform: shadowTransform(homeX, 1), opacity: .2, offset: 1 },
    );
    return { body, shadow };
  });
}
