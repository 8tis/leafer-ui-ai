@echo off
chcp 65001 >nul
title RollDek AI Canvas Studio
color 0F

echo =================================================================
echo   ⚡ RollDek AI Canvas Studio (LeaferJS 无限智能画布)
echo   Windows 一键环境安装与启动脚本
echo =================================================================
echo.

cd /d "%~dp0"

:: 1. 检查环境变量中是否已有 Node.js
where node >nul 2>nul
if %errorlevel% equ 0 goto :node_found

:: 检查本地绿色免安装版 runtime\node
if exist "%~dp0runtime\node\node.exe" (
    set "PATH=%~dp0runtime\node;%PATH%"
    goto :node_found
)

:: 检查默认安装路径
if exist "C:\Program Files\nodejs\node.exe" (
    set "PATH=C:\Program Files\nodejs;%APPDATA%\npm;%PATH%"
    goto :node_found
)

echo [环境检测] 未检测到 Node.js 环境，正在启动全自动静默安装...
echo.

:: 方式 A: 尝试通过 winget 静默安装
where winget >nul 2>nul
if %errorlevel% equ 0 (
    echo [自动安装] 检测到 Windows 官方包管理器 (winget)，正在安装 Node.js LTS...
    winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements --silent
    if exist "C:\Program Files\nodejs\node.exe" (
        set "PATH=C:\Program Files\nodejs;%APPDATA%\npm;%PATH%"
        goto :node_found
    )
)

:: 方式 B: 通过 PowerShell 自动下载官方 MSI 安装包并静默安装
echo [自动下载] 正在高速下载 Node.js LTS 安装程序...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference = 'Stop'; [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $msi = Join-Path $env:TEMP 'node_setup.msi'; try { Write-Host '正在从国内镜像源下载...'; Invoke-WebRequest -Uri 'https://mirrors.aliyun.com/nodejs-release/v20.18.0/node-v20.18.0-x64.msi' -OutFile $msi } catch { Write-Host '正在从官方源下载...'; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.18.0/node-v20.18.0-x64.msi' -OutFile $msi }; Write-Host '正在静默安装 Node.js...'; Start-Process msiexec.exe -ArgumentList '/i', $msi, '/qn', '/norestart' -Wait; Remove-Item $msi -Force -ErrorAction SilentlyContinue"

if exist "C:\Program Files\nodejs\node.exe" (
    set "PATH=C:\Program Files\nodejs;%APPDATA%\npm;%PATH%"
    goto :node_found
)

:: 方式 C: 若无管理员权限致 MSI 失败，自动下载免安装绿色版 Node.js 到本地目录
echo.
echo [自动免配] 正在下载免安装绿色版 Node.js 运行环境到本地...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference = 'Stop'; [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $zip = Join-Path $env:TEMP 'node_portable.zip'; try { Invoke-WebRequest -Uri 'https://mirrors.aliyun.com/nodejs-release/v20.18.0/node-v20.18.0-win-x64.zip' -OutFile $zip } catch { Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.18.0/node-v20.18.0-win-x64.zip' -OutFile $zip }; $tempDir = Join-Path $env:TEMP 'node_temp'; New-Item -ItemType Directory -Path $tempDir -Force | Out-Null; Expand-Archive -Path $zip -DestinationPath $tempDir -Force; $extracted = Get-ChildItem -Path $tempDir -Directory | Select-Object -First 1; $dest = Join-Path (Get-Location) 'runtime\node'; New-Item -ItemType Directory -Path (Split-Path $dest) -Force | Out-Null; Move-Item -Path $extracted.FullName -Destination $dest -Force; Remove-Item $zip -Force; Remove-Item $tempDir -Recurse -Force"

if exist "%~dp0runtime\node\node.exe" (
    set "PATH=%~dp0runtime\node;%PATH%"
    goto :node_found
)

echo [错误] 自动安装未能完成，请手动安装 Node.js: https://nodejs.org/
pause
exit /b 1

:node_found
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [成功] Node.js 运行环境就绪: %NODE_VERSION%

:: 2. 检查依赖
if exist "package.json" (
    if not exist "node_modules" (
        echo [信息] 正在初始化项目依赖...
        call npm install
    )
)

echo.
echo =================================================================
echo [启动] 正在启动 RollDek AI Canvas 本地服务...
echo [地址] http://localhost:3002
echo [提示] 浏览器即将自动打开，关闭此窗口可停止服务。
echo =================================================================
echo.

:: 延迟 1.5 秒自动唤起默认浏览器
start "" http://localhost:3002

:: 运行服务
node server.js

if %errorlevel% neq 0 (
    echo.
    echo [异常] 服务退出，错误代码: %errorlevel%
    pause
)
