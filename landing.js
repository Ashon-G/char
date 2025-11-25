const nextDom = document.getElementById('next');
const prevDom = document.getElementById('prev');
const carouselDom = document.querySelector('.carousel');
const listItemDom = document.querySelector('.carousel .list');
const thumbnailDom = document.querySelector('.carousel .thumbnail');

nextDom.onclick = function(){
  showSlider('next');
}

prevDom.onclick = function(){
  showSlider('prev');
}

const timeRunning = 3000;
let runTimeOut;

function showSlider(type){
  const itemSlider = document.querySelectorAll('.carousel .list .item');
  const itemThumbnail = document.querySelectorAll('.carousel .thumbnail .item');
  
  prevDom.disabled = true;
  nextDom.disabled = true;
  
  if(type === 'next'){
    listItemDom.appendChild(itemSlider[0]);
    thumbnailDom.appendChild(itemThumbnail[0]);
    carouselDom.classList.add('next');
  }
  
  if(type === 'prev'){
    const positionLastItem = itemSlider.length - 1;
    listItemDom.prepend(itemSlider[positionLastItem]);
    thumbnailDom.prepend(itemThumbnail[positionLastItem]);
    carouselDom.classList.add('prev');
  }

  clearTimeout(runTimeOut);
  runTimeOut = setTimeout(() => {
    prevDom.disabled = false;
  nextDom.disabled = false;
    carouselDom.classList.remove('next');
    carouselDom.classList.remove('prev');
  }, timeRunning);
}