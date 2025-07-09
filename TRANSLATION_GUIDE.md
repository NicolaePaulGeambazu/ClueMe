# Translation Guide - ClearCue

## Overview
This guide provides translations for the missing keys in Spanish (es) and French (fr) to ensure 100% translation coverage and prevent any fallbacks to English.

## Translation Status
- **Total Missing Keys**: 106 (53 Spanish + 53 French)
- **Validation Script**: `npm run validate:translations`
- **Fix Script**: `npm run fix:translations`

## Critical Missing Keys

### 1. Authentication & User Management

#### Spanish (es)
```json
{
  "auth": {
    "validation": {
      "title": "Inicio de Sesión Requerido",
      "requiredFields": "Por favor completa todos los campos requeridos."
    },
    "error": {
      "generic": "Ocurrió un error. Por favor inténtalo de nuevo.",
      "title": "Error de Autenticación"
    },
    "loginPrompt": {
      "title": "Inicio de Sesión Requerido",
      "message": "Por favor inicia sesión para continuar."
    },
    "signIn": "Iniciar Sesión",
    "signUp": "Registrarse",
    "fields": {
      "fullName": "Nombre Completo",
      "email": "Correo Electrónico",
      "password": "Contraseña"
    },
    "signingIn": "Iniciando sesión...",
    "creatingAccount": "Creando cuenta...",
    "createAccount": "Crear Cuenta",
    "anonymousDataPreserved": "Tus datos anónimos se preservarán después del inicio de sesión.",
    "termsAgreement": "Al registrarte, aceptas nuestros Términos de Servicio."
  }
}
```

#### French (fr)
```json
{
  "auth": {
    "validation": {
      "title": "Connexion Requise",
      "requiredFields": "Veuillez remplir tous les champs requis."
    },
    "error": {
      "generic": "Une erreur s'est produite. Veuillez réessayer.",
      "title": "Erreur d'Authentification"
    },
    "loginPrompt": {
      "title": "Connexion Requise",
      "message": "Veuillez vous connecter pour continuer."
    },
    "signIn": "Se Connecter",
    "signUp": "S'inscrire",
    "fields": {
      "fullName": "Nom Complet",
      "email": "E-mail",
      "password": "Mot de Passe"
    },
    "signingIn": "Connexion en cours...",
    "creatingAccount": "Création du compte...",
    "createAccount": "Créer un Compte",
    "anonymousDataPreserved": "Vos données anonymes seront préservées après la connexion.",
    "termsAgreement": "En vous inscrivant, vous acceptez nos Conditions d'Utilisation."
  }
}
```

### 2. Notification Timing

#### Spanish (es)
```json
{
  "reminders": {
    "notificationTiming": {
      "15minBefore": "15 minutos antes",
      "30minBefore": "30 minutos antes",
      "1hrBefore": "1 hora antes",
      "1dayBefore": "1 día antes",
      "atDueTime": "En el momento de vencimiento",
      "15minAfter": "15 minutos después",
      "30minAfter": "30 minutos después",
      "1hrAfter": "1 hora después"
    }
  }
}
```

#### French (fr)
```json
{
  "reminders": {
    "notificationTiming": {
      "15minBefore": "15 minutes avant",
      "30minBefore": "30 minutes avant",
      "1hrBefore": "1 heure avant",
      "1dayBefore": "1 jour avant",
      "atDueTime": "À l'heure d'échéance",
      "15minAfter": "15 minutes après",
      "30minAfter": "30 minutes après",
      "1hrAfter": "1 heure après"
    }
  }
}
```

### 3. Premium Features

#### Spanish (es)
```json
{
  "pro": {
    "unlockFeature": "Desbloquear {{feature}}",
    "unlockEverything": "Desbloquea todo el poder de ClearCue",
    "whatYouGet": "Lo que obtendrás con Pro",
    "multipleNotifications": "Múltiples Notificaciones",
    "multipleNotificationsDesc": "Configura hasta 5 notificaciones por recordatorio",
    "advancedRecurring": "Recurrencia Avanzada",
    "advancedRecurringDesc": "Intervalos personalizados y patrones complejos",
    "familySharing": "Compartir con Familia",
    "familySharingDesc": "Comparte listas y recordatorios con la familia",
    "prioritySupport": "Soporte Prioritario",
    "prioritySupportDesc": "Obtén ayuda cuando más la necesites",
    "customThemes": "Temas Personalizados",
    "customThemesDesc": "Personaliza tu experiencia",
    "advancedAnalytics": "Analíticas Avanzadas",
    "advancedAnalyticsDesc": "Rastrea tus patrones de productividad",
    "monthly": "Mensual",
    "perMonth": "por mes",
    "allFeatures": "Todas las funciones Pro incluidas",
    "cancelAnytime": "Cancela en cualquier momento",
    "freeTrial": "Prueba gratuita de 7 días",
    "upgradeToPro": "Actualizar a Pro",
    "maybeLater": "Quizás Más Tarde"
  }
}
```

#### French (fr)
```json
{
  "pro": {
    "unlockFeature": "Débloquer {{feature}}",
    "unlockEverything": "Débloquez toute la puissance de ClearCue",
    "whatYouGet": "Ce que vous obtiendrez avec Pro",
    "multipleNotifications": "Notifications Multiples",
    "multipleNotificationsDesc": "Configurez jusqu'à 5 notifications par rappel",
    "advancedRecurring": "Récurrence Avancée",
    "advancedRecurringDesc": "Intervalles personnalisés et motifs complexes",
    "familySharing": "Partage Familial",
    "familySharingDesc": "Partagez des listes et des rappels avec la famille",
    "prioritySupport": "Support Prioritaire",
    "prioritySupportDesc": "Obtenez de l'aide quand vous en avez le plus besoin",
    "customThemes": "Thèmes Personnalisés",
    "customThemesDesc": "Personnalisez votre expérience",
    "advancedAnalytics": "Analyses Avancées",
    "advancedAnalyticsDesc": "Suivez vos modèles de productivité",
    "monthly": "Mensuel",
    "perMonth": "par mois",
    "allFeatures": "Toutes les fonctionnalités Pro incluses",
    "cancelAnytime": "Annulez à tout moment",
    "freeTrial": "Essai gratuit de 7 jours",
    "upgradeToPro": "Passer à Pro",
    "maybeLater": "Peut-être Plus Tard"
  }
}
```

### 4. Lists & Organization

#### Spanish (es)
```json
{
  "lists": {
    "myLists": "Mis Listas",
    "sharedLists": "Listas Compartidas",
    "noMyLists": "Aún no tienes listas."
  }
}
```

#### French (fr)
```json
{
  "lists": {
    "myLists": "Mes Listes",
    "sharedLists": "Listes Partagées",
    "noMyLists": "Vous n'avez pas encore de listes."
  }
}
```

### 5. Error Handling

#### Spanish (es)
```json
{
  "errors": {
    "unknown": "Ocurrió un error desconocido. Por favor inténtalo de nuevo."
  },
  "edit": {
    "error": {
      "noReminderId": "No se proporcionó ID de recordatorio"
    }
  }
}
```

#### French (fr)
```json
{
  "errors": {
    "unknown": "Une erreur inconnue s'est produite. Veuillez réessayer."
  },
  "edit": {
    "error": {
      "noReminderId": "Aucun ID de rappel fourni"
    }
  }
}
```

### 6. Quick Add & UI Elements

#### Spanish (es)
```json
{
  "quickAdd": {
    "assignToMe": "👤 Yo"
  },
  "notifications": {
    "testFamilyAssignment": "Prueba de Asignación Familiar"
  }
}
```

#### French (fr)
```json
{
  "quickAdd": {
    "assignToMe": "👤 Moi"
  },
  "notifications": {
    "testFamilyAssignment": "Test d'Attribution Familiale"
  }
}
```

## Translation Best Practices

### 1. **Consistency**
- Use consistent terminology across all translations
- Maintain the same tone and formality level
- Keep technical terms consistent

### 2. **Cultural Adaptation**
- Consider cultural differences in date/time formats
- Adapt idioms and expressions appropriately
- Respect local conventions for formality

### 3. **Technical Considerations**
- Preserve all placeholders: `{{variable}}`
- Maintain HTML tags if present: `<b>text</b>`
- Keep emojis and special characters intact

### 4. **Length Considerations**
- Spanish translations are typically 20-30% longer than English
- French translations are typically 10-20% longer than English
- Consider UI space constraints for mobile apps

## Quality Assurance

### 1. **Validation Process**
```bash
# Check for missing keys and issues
npm run validate:translations

# Fix missing keys automatically
npm run fix:translations
```

### 2. **Testing Checklist**
- [ ] All keys present in all languages
- [ ] No empty strings or placeholder text
- [ ] All placeholders preserved correctly
- [ ] No English text remaining
- [ ] Proper grammar and spelling
- [ ] Consistent terminology

### 3. **Review Process**
1. **Automated Validation**: Run validation script
2. **Manual Review**: Check for context and meaning
3. **User Testing**: Test with native speakers
4. **UI Testing**: Verify text fits in UI components

## Implementation Steps

### Step 1: Add Missing Keys
1. Run `npm run fix:translations` to add missing keys
2. Review the generated TODO items
3. Translate each TODO item

### Step 2: Update Translation Files
1. Open `src/locales/es.json` and `src/locales/fr.json`
2. Replace all `TODO: ...` entries with proper translations
3. Use the translations provided in this guide

### Step 3: Validate Translations
1. Run `npm run validate:translations`
2. Fix any remaining issues
3. Repeat until validation passes

### Step 4: Test in App
1. Test the app with different language settings
2. Verify no English text appears
3. Check that all placeholders work correctly

## Common Translation Patterns

### Time Expressions
- **English**: "15 minutes before"
- **Spanish**: "15 minutos antes"
- **French**: "15 minutes avant"

### Action Verbs
- **English**: "Create", "Update", "Delete"
- **Spanish**: "Crear", "Actualizar", "Eliminar"
- **French**: "Créer", "Mettre à jour", "Supprimer"

### Status Messages
- **English**: "Loading...", "Saving...", "Error"
- **Spanish**: "Cargando...", "Guardando...", "Error"
- **French**: "Chargement...", "Enregistrement...", "Erreur"

## Resources

### Translation Tools
- **Google Translate**: For initial translations
- **DeepL**: For more accurate translations
- **Linguee**: For context and examples
- **Native Speakers**: For final review

### Reference Materials
- **iOS Human Interface Guidelines**: Language-specific guidelines
- **Material Design**: Localization guidelines
- **React Native i18n**: Best practices

## Next Steps

1. **Immediate**: Translate the critical missing keys listed above
2. **Short-term**: Complete all 106 missing translations
3. **Long-term**: Implement continuous translation validation in CI/CD
4. **Future**: Add more languages (German, Italian, Portuguese, etc.)

## Support

For questions about translations or the validation system:
1. Check the validation script output for specific issues
2. Review this guide for translation patterns
3. Test translations in the app to verify context
4. Consider professional translation services for large-scale projects

---

**Goal**: 100% translation coverage with zero fallbacks to English for a truly localized user experience. 