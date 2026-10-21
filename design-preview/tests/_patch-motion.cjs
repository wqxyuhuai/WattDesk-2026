const fs=require('fs');
const f='design-preview/src/foundations/motion.css';
let s=fs.readFileSync(f,'utf8');
const anchor=`@media (prefers-reduced-motion: reduce) {`;
const insertion=`/* Loading placeholders belong to the same contract. The layer fades out once
 * the real content exists; the revealed content enters with one short stagger.
 * The card's material, radius and layout box never animate. */
:where(.wd-skeleton-layer) {
  transition-property: opacity;
  transition-duration: var(--wd-motion-skeleton-out);
  transition-timing-function: var(--wd-ease-skeleton-out);
}
:where(.wd-skeleton[data-skeleton-state="settled"] > :not(.wd-glass-material):not(.wd-skeleton-layer)) {
  transition-property: opacity;
  transition-duration: var(--wd-motion-skeleton-in);
  transition-timing-function: var(--wd-ease-skeleton-in);
  transition-delay: calc(var(--wd-motion-stagger) * var(--wd-skeleton-order, 0));
}

`;
s=s.replace(anchor,insertion+anchor);
s=s.replace(`@media (prefers-reduced-motion: reduce) {
  :where(*, *::before, *::after) {`,`@media (prefers-reduced-motion: reduce) {
  :where(.wd-skeleton-layer) { transition: none; }
  :where(.wd-skeleton[data-skeleton-state="settled"] > :not(.wd-glass-material):not(.wd-skeleton-layer)) {
    transition: none;
    transition-delay: 0s;
  }
  :where(*, *::before, *::after) {`);
fs.writeFileSync(f,s);
console.log('ok');
