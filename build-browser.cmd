@setlocal enabledelayedexpansion
@echo off

rem �f�t�H���g�l�̐ݒ�

set src=dist\browser
set target=i:\pj\www\html\contents\test\three\horse\current
set www=""

:check
if "%1"=="" goto end-check

if "%1"=="/s" (
  if Not "%2"=="" (
    set src=%2
  ) else (
    @echo �������s�����Ă��܂��B%1
    exit /b 1
  )
  shift
  shift
  goto check
)

if "%1"=="/t" (
  if Not "%2"=="" (
    set target=i:\pj\www\html\contents\test\three\horse\%2
  ) else (
    @echo �������s�����Ă��܂��B%1
    exit /b 1
  )
  shift
  shift
  goto check
)

if "%1"=="/launch" (
  set www="launch"
  shift
  goto check
)

@echo �����Ɍ�肪����܂��B%1
exit /b 1

:end-check

if not exist !target! (
  mkdir !target!
)

call rollup -c .\rollup.config.b.js

copy /y src\html\browser\index.html !src!
xcopy /s /q /y !src! !target!

if !www!=="launch" (
  livereloadx -s !target! --include *.glb
)



