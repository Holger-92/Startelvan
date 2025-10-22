// Runtime patch: replace dom.addPlayer with DOM-safe implementation to handle data: URIs
(function(){
  function safeAddPlayerFactory(ASSET_URL) {
    return function(data) {
      var pid = data.id ? data.id : (data.side + '-' + (data.shirt || Math.random().toString(36).slice(2,7)));
      data.id = pid;
      var imgSrc = ((String(data.asset).indexOf('http') === 0 || String(data.asset).indexOf('data:') === 0) ? data.asset : ASSET_URL + data.asset);

      var $el = $('<div>').addClass('js-player player').attr({
        'data-id': data.id,
        'data-name': data.name,
        'data-side': data.side,
        'data-x': data.x,
        'data-y': data.y
      });

      var $label = $('<div>').addClass('player__label').html('<span>' + (data.name || '') + '</span>');
      var $imgWrap = $('<div>').addClass('player__img');
      var $img = $('<img>').attr({ src: imgSrc, alt: data.name || '' });

      $img.on('error', function(){
        this.onerror = null;
        this.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%" height="100%" fill="%230b1220"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="24" fill="%23e5e7eb">?</text></svg>';
      });

      $imgWrap.append($img);
      var $hit = $('<button>').addClass('player__hit').attr('aria-label','Redigera spelare');
      var $card = $('<div>').addClass('player__card');
      var $placeholder = $('<div>').addClass('player__placeholder');
      var $editBtn = $('<button>').addClass('player__edit').attr({ 'aria-label':'Redigera spelare', title:'Redigera' }).text('✎');

      $el.append($label);
      $el.append($imgWrap);
      $el.append($hit);
      $el.prepend($card);
      $el.prepend($placeholder);
      // If populateCard exists, call it; otherwise skip
      if (typeof this.populateCard === 'function') {
        this.populateCard($card, data);
      }
      $el.append($editBtn);

      return $el;
    };
  }

  // If dom is available on page, patch it. If not, attach to window for later.
  var ASSET_URL = window.ASSET_URL || '';
  function applyPatch() {
    if (window.dom && typeof window.dom.addPlayer === 'function') {
      window.dom.addPlayer = safeAddPlayerFactory(ASSET_URL).bind(window.dom);
    }
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    applyPatch();
  } else {
    document.addEventListener('DOMContentLoaded', applyPatch);
  }
})();
