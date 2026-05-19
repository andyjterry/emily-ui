'use strict'

function overflowUtilities() {
  return `/* Overflow & Clipping */
.overflow-auto { overflow: auto; }
.overflow-hidden { overflow: hidden; }
.overflow-clip { overflow: clip; }
.overflow-visible { overflow: visible; }
.overflow-scroll { overflow: scroll; }
.overflow-x-auto { overflow-x: auto; }
.overflow-x-hidden { overflow-x: hidden; }
.overflow-x-clip { overflow-x: clip; }
.overflow-x-visible { overflow-x: visible; }
.overflow-x-scroll { overflow-x: scroll; }
.overflow-y-auto { overflow-y: auto; }
.overflow-y-hidden { overflow-y: hidden; }
.overflow-y-clip { overflow-y: clip; }
.overflow-y-visible { overflow-y: visible; }
.overflow-y-scroll { overflow-y: scroll; }
.overscroll-auto { overscroll-behavior: auto; }
.overscroll-contain { overscroll-behavior: contain; }
.overscroll-none { overscroll-behavior: none; }
.overscroll-x-auto { overscroll-behavior-x: auto; }
.overscroll-x-contain { overscroll-behavior-x: contain; }
.overscroll-x-none { overscroll-behavior-x: none; }
.overscroll-y-auto { overscroll-behavior-y: auto; }
.overscroll-y-contain { overscroll-behavior-y: contain; }
.overscroll-y-none { overscroll-behavior-y: none; }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.text-ellipsis { text-overflow: ellipsis; }
.text-clip { text-overflow: clip; }
.line-clamp-none { overflow: visible; display: block; -webkit-box-orient: horizontal; -webkit-line-clamp: unset; }
.line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.line-clamp-4 { display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
.line-clamp-5 { display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; }
.line-clamp-6 { display: -webkit-box; -webkit-line-clamp: 6; -webkit-box-orient: vertical; overflow: hidden; }

`;
}

module.exports = {
  overflowUtilities,
};
