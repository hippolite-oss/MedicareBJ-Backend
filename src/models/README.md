# Structure des Modèles - Documentation

## Vue d'Ensemble

Cette documentation décrit la nouvelle structure des modèles après la restructuration du 17 mai 2026.

## Modèles Principaux

### 1. Utilisateur
**Table**: `utilisateurs`  
**Clé primaire**: `id` (UUID)

Modèle de base pour tous les utilisateurs du système. Contient les informations communes à tous les types d'utilisateurs.

**Rôles possibles**:
- `patient` - Utilisateur patient
- `usager` - Utilisateur simple
- `medecin` - Professionnel de santé médecin
- `technicien` - Professionnel de santé technicien
- `admin` - Administrateur système

### 2. Patient (anciennement ProfilMedical)
**Table**: `patients`  
**Clé primaire**: `id_utilisateur` (UUID, FK vers Utilisateur)

Profil médical d'un patient. Utilise `id_utilisateur` comme clé primaire, établissant une relation 1:1 avec Utilisateur.

**Relation avec Utilisateur**:
```javascript
Utilisateur.hasOne(Patient, { foreignKey: 'id_utilisateur', as: 'patient' });
Patient.belongsTo(Utilisateur, { foreignKey: 'id_utilisateur' });
```

**Champs principaux**:
- `groupe_sanguin` - Groupe sanguin (A+, A-, B+, B-, AB+, AB-, O+, O-)
- `allergies` - Liste des allergies
- `antecedents` - Antécédents médicaux
- `poids_kg`, `taille_cm` - Données biométriques
- `medecin_traitant` - Nom du médecin traitant
- `mutuelle` - Informations mutuelle
- `numero_securite_sociale` - Numéro de sécurité sociale

### 3. Professionnel (anciennement ProfilProfessionnel)
**Table**: `professionnels`  
**Clé primaire**: `id_utilisateur` (UUID, FK vers Utilisateur)

Profil professionnel d'un médecin ou technicien. Utilise `id_utilisateur` comme clé primaire.

**Relation avec Utilisateur**:
```javascript
Utilisateur.hasOne(Professionnel, { foreignKey: 'id_utilisateur', as: 'professionnel' });
Professionnel.belongsTo(Utilisateur, { foreignKey: 'id_utilisateur' });
```

**Champs principaux**:
- `id_hopital` - Hôpital d'affectation
- `numero_ordre` - Numéro d'ordre professionnel (unique)
- `specialite` - Spécialité médicale
- `statut_validation` - Statut de validation du compte (en_attente, valide, rejete)
- `tarif_consultation` - Tarif de consultation

### 4. Medicament (nouveau)
**Table**: `medicaments`  
**Clé primaire**: `id` (UUID)

Catalogue des médicaments disponibles dans le système.

**Champs**:
- `nom` - Nom du médicament
- `dosage` - Dosage (ex: 500mg, 10ml)
- `forme` - Forme pharmaceutique (comprimé, sirop, injection, etc.)

### 5. MedicamentPrescrit (modifié)
**Table**: `medicaments_prescrits`  
**Clé primaire composite**: (`id_prescription`, `id_medicament`)

Table d'association entre Prescription et Medicament. Implémente une relation many-to-many.

**Relations**:
```javascript
// Relation many-to-many
Prescription.belongsToMany(Medicament, { 
  through: MedicamentPrescrit, 
  foreignKey: 'id_prescription',
  otherKey: 'id_medicament',
  as: 'medicaments' 
});

Medicament.belongsToMany(Prescription, { 
  through: MedicamentPrescrit, 
  foreignKey: 'id_medicament',
  otherKey: 'id_prescription',
  as: 'prescriptions' 
});
```

**Champs de la table d'association**:
- `frequence` - Fréquence de prise (ex: "3 fois/jour")
- `duree_jours` - Durée du traitement en jours
- `instructions` - Instructions spécifiques

## Schéma des Relations

```
Utilisateur (1) ──────── (1) Patient
     │
     ├────────── (1) Professionnel
     │
     ├────────── (1) DossierMedical
     │
     ├────────── (n) RendezVous (en tant que patient)
     │
     └────────── (n) RendezVous (en tant que medecin)

DossierMedical (1) ──── (n) Consultation
                   │
                   └──── (n) Prescription

Prescription (n) ──────── (n) Medicament
              └── via MedicamentPrescrit (table d'association)

Professionnel (n) ────── (1) Hopital
```

## Exemples d'Utilisation

### Créer un Patient
```javascript
const { Utilisateur, Patient } = require('./models');

// 1. Créer l'utilisateur
const utilisateur = await Utilisateur.create({
  nom: 'Dupont',
  prenom: 'Jean',
  email: 'jean.dupont@email.com',
  mot_de_passe: hashedPassword,
  role: 'patient'
});

// 2. Créer le profil patient
const patient = await Patient.create({
  id_utilisateur: utilisateur.id,
  groupe_sanguin: 'A+',
  allergies: 'Pénicilline',
  poids_kg: 75.5,
  taille_cm: 180
});
```

### Récupérer un Utilisateur avec son Profil Patient
```javascript
const utilisateur = await Utilisateur.findByPk(userId, {
  include: [
    {
      model: Patient,
      as: 'patient'
    }
  ]
});

console.log(utilisateur.patient.groupe_sanguin);
```

### Créer une Prescription avec Médicaments
```javascript
const { Prescription, Medicament, MedicamentPrescrit } = require('./models');

// 1. Créer ou trouver le médicament
let paracetamol = await Medicament.findOne({
  where: { nom: 'Paracétamol', dosage: '500mg', forme: 'comprimé' }
});

if (!paracetamol) {
  paracetamol = await Medicament.create({
    nom: 'Paracétamol',
    dosage: '500mg',
    forme: 'comprimé'
  });
}

// 2. Créer la prescription
const prescription = await Prescription.create({
  id_consultation: consultationId,
  id_medecin: medecinId,
  id_dossier: dossierId,
  numero_ordonnance: 'ORD-2026-001',
  instructions_generales: 'À prendre avec de l\'eau'
});

// 3. Associer le médicament (méthode 1: via Sequelize)
await prescription.addMedicament(paracetamol, {
  through: {
    frequence: '3 fois par jour',
    duree_jours: 7,
    instructions: 'Après les repas'
  }
});

// OU (méthode 2: création directe)
await MedicamentPrescrit.create({
  id_prescription: prescription.id,
  id_medicament: paracetamol.id,
  frequence: '3 fois par jour',
  duree_jours: 7,
  instructions: 'Après les repas'
});
```

### Récupérer une Prescription avec ses Médicaments
```javascript
const prescription = await Prescription.findByPk(prescriptionId, {
  include: [
    {
      model: Medicament,
      as: 'medicaments',
      through: {
        attributes: ['frequence', 'duree_jours', 'instructions']
      }
    }
  ]
});

// Accéder aux médicaments
prescription.medicaments.forEach(medicament => {
  console.log(`${medicament.nom} ${medicament.dosage}`);
  console.log(`Fréquence: ${medicament.MedicamentPrescrit.frequence}`);
  console.log(`Durée: ${medicament.MedicamentPrescrit.duree_jours} jours`);
});
```

## Changements par Rapport à l'Ancienne Structure

### ProfilMedical → Patient
- ❌ Suppression du champ `id` comme clé primaire
- ✅ `id_utilisateur` devient la clé primaire
- ✅ Relation 1:1 plus claire avec Utilisateur
- ✅ Nom de table plus explicite: `patients`

### ProfilProfessionnel → Professionnel
- ❌ Suppression du champ `id` comme clé primaire
- ✅ `id_utilisateur` devient la clé primaire
- ✅ Relation 1:1 plus claire avec Utilisateur
- ✅ Nom de table plus explicite: `professionnels`

### MedicamentPrescrit
- ❌ Suppression du champ `id` comme clé primaire
- ❌ Suppression des champs: `nom_medicament`, `dosage`, `forme`, `ordre`
- ✅ Clé primaire composite: (`id_prescription`, `id_medicament`)
- ✅ Devient une vraie table d'association
- ✅ Normalisation: les informations du médicament sont dans la table `medicaments`

### Nouveau: Medicament
- ✅ Centralisation des informations sur les médicaments
- ✅ Évite la duplication des données
- ✅ Facilite la gestion d'un catalogue de médicaments
- ✅ Permet des recherches et statistiques sur les médicaments

## Avantages de la Nouvelle Structure

1. **Normalisation**: Élimination de la redondance des données médicaments
2. **Intégrité**: Relations 1:1 plus claires entre Utilisateur et ses profils
3. **Performance**: Clés primaires plus efficaces (pas de UUID supplémentaire)
4. **Maintenabilité**: Structure plus intuitive et conforme aux bonnes pratiques
5. **Évolutivité**: Facilite l'ajout de fonctionnalités (catalogue médicaments, interactions, etc.)

## Migration

Voir le fichier `backend/migrations/restructuration-modeles.sql` pour les scripts de migration SQL.

Voir le fichier `backend/CHANGEMENTS_MODELES.md` pour le guide complet de migration du code.
