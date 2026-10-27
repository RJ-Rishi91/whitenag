; Nagfani Foods ERP - Tally Gateway NSIS Installer Script
Unicode True
RequestExecutionLevel user
SetCompressor /SOLID lzma

!define PRODUCT_NAME "Nagfani Foods ERP - Tally Gateway"
!define PRODUCT_VERSION "1.0.0"
!define PRODUCT_PUBLISHER "Nagfani Foods"
!define PRODUCT_DIR_REGKEY "Software\NagfaniTallyGateway"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\NagfaniTallyGateway"

Name "${PRODUCT_NAME}"
OutFile "Nagfani_Tally_Gateway_Setup.exe"
InstallDir "$LOCALAPPDATA\NagfaniTallyGateway"
InstallDirRegKey HKCU "${PRODUCT_DIR_REGKEY}" "Install_Dir"
Icon "app_icon.ico"
UninstallIcon "app_icon.ico"

; Modern UI
!include "MUI2.nsh"

!define MUI_ABORTWARNING
!define MUI_ICON "app_icon.ico"
!define MUI_UNICON "app_icon.ico"

; Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES

; Finish page setup
!define MUI_FINISHPAGE_RUN
!define MUI_FINISHPAGE_RUN_TEXT "Launch Nagfani Tally Gateway now"
!define MUI_FINISHPAGE_RUN_FUNCTION "LaunchApp"
!insertmacro MUI_PAGE_FINISH

; Uninstaller Pages
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

Section "MainSection" SEC01
  SetOutPath "$INSTDIR"
  SetOverwrite on

  DetailPrint "Extracting Nagfani Tally Gateway application files..."
  File /r "app_files\*.*"
  File "app_icon.ico"
  
  DetailPrint "Extracting runtime setup assets..."
  SetOutPath "$INSTDIR\wheels"
  File /r "wheels\*.*"

  SetOutPath "$INSTDIR"
  File "python-installer.exe"

  ; Create Desktop and Start Menu Shortcuts
  DetailPrint "Creating Desktop and Start Menu Shortcuts..."
  CreateDirectory "$SMPROGRAMS\Nagfani Foods"
  CreateShortcut "$DESKTOP\Nagfani Tally Connector.lnk" "$SYSDIR\wscript.exe" '"$INSTDIR\Launch_Nagfani_Connector.vbs"' "$INSTDIR\app_icon.ico" 0
  CreateShortcut "$SMPROGRAMS\Nagfani Foods\Nagfani Tally Gateway.lnk" "$SYSDIR\wscript.exe" '"$INSTDIR\Launch_Nagfani_Connector.vbs"' "$INSTDIR\app_icon.ico" 0
  CreateShortcut "$SMPROGRAMS\Nagfani Foods\Uninstall Tally Gateway.lnk" "$INSTDIR\Uninstall.exe" "" "$INSTDIR\app_icon.ico" 0

  ; Register in Windows Add/Remove Programs
  WriteRegStr HKCU "${PRODUCT_DIR_REGKEY}" "Install_Dir" "$INSTDIR"
  WriteRegStr HKCU "${PRODUCT_UNINST_KEY}" "DisplayName" "${PRODUCT_NAME}"
  WriteRegStr HKCU "${PRODUCT_UNINST_KEY}" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegStr HKCU "${PRODUCT_UNINST_KEY}" "DisplayIcon" "$INSTDIR\app_icon.ico"
  WriteRegStr HKCU "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr HKCU "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
  WriteUninstaller "$INSTDIR\Uninstall.exe"

  ; Configure Python Runtime
  DetailPrint "Checking Python environment..."
  nsExec::ExecToStack 'python --version'
  Pop $0
  Pop $1
  StrCmp $0 "0" python_ok install_python

install_python:
  DetailPrint "Installing official Python 3.11 runtime (silent)..."
  ExecWait '"$INSTDIR\python-installer.exe" /quiet InstallAllUsers=0 PrependPath=1 Include_test=0 SimpleInstall=1' $0
  DetailPrint "Python installer finished with code: $0"

python_ok:
  DetailPrint "Verifying required packages (requests)..."
  nsExec::ExecToLog 'python -m pip install --no-index --find-links="$INSTDIR\wheels" requests --quiet'
  
  ; Cleanup setup binaries
  Delete "$INSTDIR\python-installer.exe"
  RMDir /r "$INSTDIR\wheels"

  DetailPrint "Setup completed successfully!"
SectionEnd

Function LaunchApp
  ExecShell "" "$SYSDIR\wscript.exe" '"$INSTDIR\Launch_Nagfani_Connector.vbs"'
FunctionEnd

Section "Uninstall"
  Delete "$DESKTOP\Nagfani Tally Connector.lnk"
  Delete "$SMPROGRAMS\Nagfani Foods\Nagfani Tally Gateway.lnk"
  Delete "$SMPROGRAMS\Nagfani Foods\Uninstall Tally Gateway.lnk"
  RMDir "$SMPROGRAMS\Nagfani Foods"

  RMDir /r "$INSTDIR"

  DeleteRegKey HKCU "${PRODUCT_UNINST_KEY}"
  DeleteRegKey HKCU "${PRODUCT_DIR_REGKEY}"
SectionEnd
