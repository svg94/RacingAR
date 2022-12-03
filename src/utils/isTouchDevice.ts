export function isTouchDevice(){
    return (('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0));
}

// export function addJoystick() {
//     let joyManager;
//     const options = {
//         zone: document.getElementById('joystickWrapper1'),
//         size: 120,
//         multitouch: true,
//         maxNumberOfNipples: 2,
//         mode: 'static',
//         restJoystick: true,
//         shape: 'circle',
//         // position: { top: 20, left: 20 },
//         position: { top: '60px', left: '60px' },
//         dynamicPage: true,
//     }
//
//
//     joyManager = nipplejs.create(options);
//
//     joyManager['0'].on('move', function (evt, data) {
//         const forward = data.vector.y
//         const turn = data.vector.x
//
//         if (forward > 0) {
//             fwdValue = Math.abs(forward)
//             bkdValue = 0
//         } else if (forward < 0) {
//             fwdValue = 0
//             bkdValue = Math.abs(forward)
//         }
//
//         if (turn > 0) {
//             lftValue = 0
//             rgtValue = Math.abs(turn)
//         } else if (turn < 0) {
//             lftValue = Math.abs(turn)
//             rgtValue = 0
//         }
//     })
//
//     joyManager['0'].on('end', function (evt) {
//         bkdValue = 0
//         fwdValue = 0
//         lftValue = 0
//         rgtValue = 0
//     })
//     return joyManager;
// }
