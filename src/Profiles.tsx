import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserIcon, AlertCircle, CheckCircle2, Plus, Trash2, Save, X, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import { User, DietaryConstraint } from './types';
import { cn, capitalizeWords } from './lib/utils';
import { db, collection, onSnapshot, setDoc, doc, deleteDoc, OperationType, handleFirestoreError } from './firebase';

const CONSTRAINT_LABELS: Record<string, { label: string, color: string, iconColor: string }> = {
  'dislike': { label: "N'aime pas", color: 'bg-orange-50 border-orange-100 text-orange-700', iconColor: 'text-orange-500' },
  'allergie': { label: 'Allergie', color: 'bg-red-50 border-red-100 text-red-800', iconColor: 'text-red-600' },
  'intolerance': { label: 'Intolérance', color: 'bg-amber-50 border-amber-100 text-amber-700', iconColor: 'text-amber-500' },
  'régime': { label: 'Régime', color: 'bg-emerald-50 border-emerald-100 text-emerald-700', iconColor: 'text-emerald-500' },
};

const COMMON_CONSTRAINTS = [
  { label: 'Gluten', type: 'intolerance' },
  { label: 'Lactose', type: 'intolerance' },
  { label: 'Fruits à coque', type: 'allergie' },
  { label: 'Arachides', type: 'allergie' },
  { label: 'Œufs', type: 'allergie' },
  { label: 'Poisson', type: 'allergie' },
  { label: 'Crustacés', type: 'allergie' },
  { label: 'Soja', type: 'allergie' },
  { label: 'Céleri', type: 'allergie' },
  { label: 'Moutarde', type: 'allergie' },
  { label: 'Sésame', type: 'allergie' },
  { label: 'Sulfites', type: 'allergie' },
  { label: 'Lupin', type: 'allergie' },
  { label: 'Mollusques', type: 'allergie' },
  { label: 'Végétarien', type: 'régime' },
  { label: 'Végétalien', type: 'régime' },
  { label: 'Halal', type: 'régime' },
  { label: 'Casher', type: 'régime' },
  { label: 'Sans Porc', type: 'régime' },
];

function ProfileCard({ 
  user, 
  constraints, 
  editingUserId, 
  setEditingUserId, 
  editName, 
  setEditName, 
  saveName, 
  startEditing, 
  deleteUser, 
  addConstraint, 
  removeConstraint 
}: { 
  user: User, 
  constraints: DietaryConstraint[], 
  editingUserId: number | null, 
  setEditingUserId: (id: number | null) => void, 
  editName: string, 
  setEditName: (name: string) => void, 
  saveName: (id: number) => void, 
  startEditing: (user: User) => void, 
  deleteUser: (id: number) => void, 
  addConstraint: (userId: number, type: string, value: string) => void, 
  removeConstraint: (id: number) => void 
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const isEditing = editingUserId === user.user_id;

  return (
    <motion.div
      layout
      className="bg-white rounded-3xl border border-[#E5E7EB] shadow-sm overflow-hidden group flex flex-col"
    >
      {/* Card Header - Always visible */}
      <div className="p-6 flex justify-between items-start bg-white z-10">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 bg-[#FFEAA7] rounded-2xl flex items-center justify-center text-[#FF7675] shrink-0">
            <UserIcon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input 
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-2 py-1 bg-gray-50 border border-[#FF7675] rounded-lg text-base font-bold outline-none"
                  autoFocus
                />
                <button onClick={() => saveName(user.user_id)} className="p-1 text-green-600 hover:bg-green-50 rounded">
                  <Save className="w-4 h-4" />
                </button>
                <button onClick={() => setEditingUserId(null)} className="p-1 text-gray-400 hover:bg-gray-50 rounded">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[#2D3436] truncate">{user.name}</h3>
                <button 
                  onClick={() => startEditing(user)}
                  className="p-1 text-gray-300 hover:text-[#FF7675] opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <p className="text-xs text-[#636E72]">ID: #{user.user_id}</p>
              <span className="text-[10px] text-[#B2BEC3]">•</span>
              <p className="text-[10px] font-bold uppercase text-[#FF7675]">
                {constraints.length} restriction{constraints.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!isEditing && (
            <button 
              onClick={() => deleteUser(user.user_id)}
              className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-[#636E72] hover:bg-gray-50 rounded-xl transition-all"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-2 space-y-6 border-t border-gray-50">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-[#B2BEC3]">Ajouter une intolérance / régime</label>
                  <select 
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm outline-none focus:border-[#FF7675]"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) return;
                      const [type, label] = val.split('|');
                      addConstraint(user.user_id, type, label);
                      e.target.value = '';
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>Sélectionner une contrainte...</option>
                    <optgroup label="Allergies">
                      {COMMON_CONSTRAINTS.filter(c => c.type === 'allergie').map(c => (
                        <option key={c.label} value={`${c.type}|${c.label}`}>{c.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Intolérances">
                      {COMMON_CONSTRAINTS.filter(c => c.type === 'intolerance').map(c => (
                        <option key={c.label} value={`${c.type}|${c.label}`}>{c.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Régimes / Contraintes">
                      {COMMON_CONSTRAINTS.filter(c => c.type === 'régime').map(c => (
                        <option key={c.label} value={`${c.type}|${c.label}`}>{c.label}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#B2BEC3]">Contraintes actuelles</h4>
                  <div className="space-y-2">
                    {constraints.map((c) => {
                      const style = CONSTRAINT_LABELS[c.constraint_type] || { label: c.constraint_type, color: 'bg-gray-50 border-gray-100 text-gray-700', iconColor: 'text-gray-400' };
                      return (
                        <div key={c.constraint_id} className={cn("flex justify-between items-center p-3 rounded-xl border transition-all group/item", style.color)}>
                          <div className="flex items-center gap-2 text-sm flex-nowrap min-w-0">
                            <AlertCircle className={cn("w-4 h-4 shrink-0", style.iconColor)} />
                            <span className="font-bold whitespace-nowrap">{style.label}:</span>
                            <span className="truncate">{capitalizeWords(c.constraint_value)}</span>
                          </div>
                          <button 
                            onClick={() => removeConstraint(c.constraint_id)}
                            className="text-gray-400 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                    {constraints.length === 0 && (
                      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-xl border border-green-100">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Aucune Restriction</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <label className="text-[10px] font-bold uppercase text-[#B2BEC3]">Ajouter une contrainte personnalisée</label>
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const input = form.elements.namedItem('customValue') as HTMLInputElement;
                      const type = form.elements.namedItem('customType') as HTMLSelectElement;
                      if (input.value && type.value) {
                        addConstraint(user.user_id, type.value, input.value);
                        input.value = '';
                      }
                    }}
                    className="space-y-2"
                  >
                    <div className="flex items-center gap-2 h-9">
                      <select 
                        name="customType"
                        className="h-full px-3 bg-[#FF7675] text-white border-none rounded-xl text-[9px] font-black uppercase tracking-tight outline-none cursor-pointer w-24 shrink-0 appearance-none text-center"
                        defaultValue="dislike"
                      >
                        <option value="allergie" className="text-black bg-white">Allergie</option>
                        <option value="intolerance" className="text-black bg-white">Intolérance</option>
                        <option value="dislike" className="text-black bg-white">N'aime pas</option>
                        <option value="régime" className="text-black bg-white">Régime</option>
                      </select>
                      <input 
                        name="customValue"
                        type="text" 
                        placeholder="Ex: Oignons..."
                        className="flex-1 h-full px-4 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:border-[#FF7675]"
                      />
                      <button type="submit" className="h-full px-3 bg-[#2D3436] rounded-xl text-white hover:bg-black transition-all shadow-sm flex items-center justify-center shrink-0">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Profiles() {
  const [users, setUsers] = React.useState<User[]>([]);
  const [constraints, setConstraints] = React.useState<DietaryConstraint[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isAddingUser, setIsAddingUser] = React.useState(false);
  const [newUser, setNewUser] = React.useState({ name: '', notes: '' });
  const [editingUserId, setEditingUserId] = React.useState<number | null>(null);
  const [editName, setEditName] = React.useState('');

  React.useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => doc.data() as User);
      setUsers(usersData.sort((a, b) => a.user_id - b.user_id));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

    const unsubConstraints = onSnapshot(collection(db, 'constraints'), (snapshot) => {
      const constraintsData = snapshot.docs.map(doc => doc.data() as DietaryConstraint);
      setConstraints(constraintsData.sort((a, b) => a.constraint_id - b.constraint_id));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'constraints'));

    return () => {
      unsubUsers();
      unsubConstraints();
    };
  }, []);

  const addUser = async () => {
    const id = users.length > 0 ? Math.max(...users.map(u => u.user_id)) + 1 : 1;
    const user = { user_id: id, ...newUser };
    try {
      await setDoc(doc(db, 'users', id.toString()), user);
      setIsAddingUser(false);
      setNewUser({ name: '', notes: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${id}`);
    }
  };

  const deleteUser = async (id: number) => {
    try {
      await deleteDoc(doc(db, 'users', id.toString()));
      // Also delete associated constraints
      const userConstraints = constraints.filter(c => c.user_id === id);
      for (const c of userConstraints) {
        await deleteDoc(doc(db, 'constraints', c.constraint_id.toString()));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${id}`);
    }
  };

  const startEditing = (user: User) => {
    setEditingUserId(user.user_id);
    setEditName(user.name);
  };

  const saveName = async (userId: number) => {
    try {
      const user = users.find(u => u.user_id === userId);
      if (user) {
        await setDoc(doc(db, 'users', userId.toString()), { ...user, name: editName });
      }
      setEditingUserId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const addConstraint = async (userId: number, type: string, value: string) => {
    const id = constraints.length > 0 ? Math.max(...constraints.map(c => c.constraint_id)) + 1 : 1;
    const constraint = { constraint_id: id, user_id: userId, constraint_type: type, constraint_value: value };
    try {
      await setDoc(doc(db, 'constraints', id.toString()), constraint);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `constraints/${id}`);
    }
  };

  const removeConstraint = async (id: number) => {
    try {
      await deleteDoc(doc(db, 'constraints', id.toString()));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `constraints/${id}`);
    }
  };

  if (loading) return <div className="flex justify-center py-20">Chargement Des Profils...</div>;

  return (
    <div className="space-y-12">
      {/* Welcome Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#FF7675] to-[#D63031] p-8 md:p-12 rounded-[2.5rem] text-white shadow-xl space-y-4"
      >
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">Bienvenue dans votre cercle culinaire</h1>
        <p className="text-white/90 text-lg max-w-2xl leading-relaxed">
          Gérez ici les profils de vos amies. Ajoutez leurs régimes spécifiques (Halal, Casher, Sans Gluten) 
          ou les ingrédients qu'elles détestent pour obtenir des recommandations de recettes parfaites.
        </p>
      </motion.div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-[#2D3436]">Gestion du cercle</h2>
          <p className="text-[#636E72]">Ajoutez vos amis et leurs préférences alimentaires.</p>
        </div>
        <button 
          onClick={() => setIsAddingUser(true)}
          className="flex items-center gap-2 px-6 py-3 bg-[#FF7675] text-white rounded-2xl font-bold shadow-lg hover:bg-[#FF7675]/90 transition-all"
        >
          <Plus className="w-5 h-5" />
          Ajouter une amie
        </button>
      </div>

      <AnimatePresence>
        {isAddingUser && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-8 rounded-3xl border-2 border-dashed border-[#FFEAA7] space-y-6"
          >
            <div className="grid md:grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#636E72]">Nom de l'amie</label>
                <input 
                  type="text" 
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Ex: Julie"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF7675]/20 outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsAddingUser(false)}
                className="px-6 py-3 text-[#636E72] font-bold"
              >
                Annuler
              </button>
              <button 
                onClick={addUser}
                className="px-8 py-3 bg-[#2D3436] text-white rounded-xl font-bold"
              >
                Enregistrer le profil
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
        {users.map((user) => (
          <ProfileCard 
            key={user.user_id}
            user={user}
            constraints={constraints.filter(c => c.user_id === user.user_id)}
            editingUserId={editingUserId}
            setEditingUserId={setEditingUserId}
            editName={editName}
            setEditName={setEditName}
            saveName={saveName}
            startEditing={startEditing}
            deleteUser={deleteUser}
            addConstraint={addConstraint}
            removeConstraint={removeConstraint}
          />
        ))}
      </div>
    </div>
  );
}
