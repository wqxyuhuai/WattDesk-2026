// Blocking before styles: restore the shared preference without a first-paint transition.
try{document.documentElement.dataset.theme=localStorage.getItem("wattdesk-home-theme")==="light"?"light":"dark"}
catch{document.documentElement.dataset.theme="dark"}
