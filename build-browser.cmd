set src=dist\browser

if "%1"=="" (
  set target=i:\pj\www\html\contents\test\three\horse\current
) else (
  set target=i:\pj\www\html\contents\test\three\horse\%1
)

if not exist %target% (
  mkdir %target%
)

call rollup -c .\rollup.config.b.js

copy /y src\html\browser\index.html %src%
xcopy /s /q /y %src% %target%

livereloadx -s %target%

