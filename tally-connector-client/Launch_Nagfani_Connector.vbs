Option Explicit
Dim WshShell, fso, currentDir, pythonExe, userProfile, localAppData, programFiles, candidate

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

currentDir = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = currentDir

userProfile = WshShell.ExpandEnvironmentStrings("%USERPROFILE%")
localAppData = WshShell.ExpandEnvironmentStrings("%LOCALAPPDATA%")
programFiles = WshShell.ExpandEnvironmentStrings("%ProgramFiles%")

pythonExe = ""

' Helper to check file existence
Function CheckExe(path)
    CheckExe = False
    If path <> "" Then
        If fso.FileExists(path) Then
            CheckExe = True
        End If
    End If
End Function

' 1. Check Python launcher pyw.exe / py.exe in Windows folder
If CheckExe("C:\Windows\pyw.exe") Then
    pythonExe = "C:\Windows\pyw.exe"
ElseIf CheckExe("C:\Windows\py.exe") Then
    pythonExe = "C:\Windows\py.exe"
End If

' 2. Check %LOCALAPPDATA%\Programs\Python\Python3xx (Default User Installation)
If pythonExe = "" Then
    Dim pythonBase, folder, subFolder
    pythonBase = localAppData & "\Programs\Python"
    If fso.FolderExists(pythonBase) Then
        Set folder = fso.GetFolder(pythonBase)
        For Each subFolder In folder.SubFolders
            If CheckExe(subFolder.Path & "\pythonw.exe") Then
                pythonExe = subFolder.Path & "\pythonw.exe"
                Exit For
            ElseIf CheckExe(subFolder.Path & "\python.exe") Then
                pythonExe = subFolder.Path & "\python.exe"
                Exit For
            End If
        Next
    End If
End If

' 3. Check C:\Program Files\Python
If pythonExe = "" Then
    Dim pfBase
    pfBase = programFiles & "\Python"
    If fso.FolderExists(pfBase) Then
        Set folder = fso.GetFolder(pfBase)
        For Each subFolder In folder.SubFolders
            If CheckExe(subFolder.Path & "\pythonw.exe") Then
                pythonExe = subFolder.Path & "\pythonw.exe"
                Exit For
            ElseIf CheckExe(subFolder.Path & "\python.exe") Then
                pythonExe = subFolder.Path & "\python.exe"
                Exit For
            End If
        Next
    End If
End If

' 4. Check Root C:\Python3xx
If pythonExe = "" Then
    Dim i
    For i = 314 To 309 Step -1
        candidate = "C:\Python" & i & "\pythonw.exe"
        If CheckExe(candidate) Then
            pythonExe = candidate
            Exit For
        End If
        candidate = "C:\Python" & i & "\python.exe"
        If CheckExe(candidate) Then
            pythonExe = candidate
            Exit For
        End If
    Next
End If

' 5. Test if pythonw or python is accessible via system PATH
If pythonExe = "" Then
    On Error Resume Next
    Dim testRun
    testRun = WshShell.Run("pythonw.exe -c ""import sys""", 0, True)
    If Err.Number = 0 And testRun = 0 Then
        pythonExe = "pythonw.exe"
    Else
        Err.Clear
        testRun = WshShell.Run("python.exe -c ""import sys""", 0, True)
        If Err.Number = 0 And testRun = 0 Then
            pythonExe = "python.exe"
        End If
    End If
    On Error GoTo 0
End If

' 6. Launch or prompt user with friendly action
If pythonExe <> "" Then
    WshShell.Run """" & pythonExe & """ """ & currentDir & "\connector_gui.py""", 0, False
Else
    Dim ans
    ans = MsgBox("Python 3 is required to run the Nagfani Tally Connector, but was not detected." & vbCrLf & vbCrLf & _
                 "To set up automatically:" & vbCrLf & _
                 "1. Double-click 'Setup_Windows.bat' in this folder." & vbCrLf & vbCrLf & _
                 "Would you like to open the official Python download page now?", _
                 vbYesNo + vbInformation, "Nagfani Tally Gateway — Setup Required")
    If ans = vbYes Then
        WshShell.Run "https://www.python.org/downloads/"
    End If
End If

Set fso = Nothing
Set WshShell = Nothing
