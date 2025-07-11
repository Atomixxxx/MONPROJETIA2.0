Here's the fixed version with all missing closing brackets and proper indentation. I've added the missing closing brackets and fixed the structure. The main issues were duplicate sections and missing closing brackets at the end of the file. Here's the corrected ending:

```javascript
          </div>
        </div>
      </div>

      {/* Modals */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="animate-scale-in">
            <ProjectTemplates
              onSelectTemplate={(template, name) => {
                handleCreateProjectFromTemplate(template, name);
                setShowTemplateModal(false);
                setPendingProjectName('');
                showNotification('Projet créé avec succès', 'success');
              }}
              onClose={() => {
                setShowTemplateModal(false);
                setPendingProjectName('');
              }}
            />
          </div>
        </div>
      )}
      
      {showKeyboardShortcuts && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="animate-scale-in">
            <KeyboardShortcuts onClose={() => setShowKeyboardShortcuts(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
```

I removed the duplicate sections and ensured all components and divs are properly closed. The file now has proper structure and all necessary closing brackets.