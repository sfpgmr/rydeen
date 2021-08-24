if($args[0] -eq 1){
  $opt = 1  
  .\trans-t.cmd
} else {
  $opt = 0
}
electron . -configpath ./technopolis.json -generate $opt