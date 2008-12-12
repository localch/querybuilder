<?php
  $url = urldecode($_GET['url']);
  $xslt = urldecode($_GET['xslt']);
  if (empty($url) || empty($xslt)) {
    die('you need to specify both: url and xslt');
  }
  header('Content-Type: text/html');
  $paramString = '';
  foreach ($_GET as $key => $value) {
      $paramString .= " --stringparam $key '".urldecode($value)."'";
  }
  passthru('wget -nv "'.$url.'" -O - | xsltproc '.$paramString.' xslt/'.$xslt.' - 2>&1');
?>
