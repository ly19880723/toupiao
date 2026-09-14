'use client';

import React, { useState, useEffect } from 'react';
import { Button, Input, Modal, Notification } from './animal-ui';

interface PrizeData {
  label: string;
  icon: string;
  subs: { value: string; label: string }[];
}

interface PrizeAdminProps {
  data: Record<string, PrizeData>;
  onSave: (data: Record<string, PrizeData>) => void;
  onClose: () => void;
}

export function PrizeAdmin({ data, onSave, onClose }: PrizeAdminProps) {
  const [localData, setLocalData] = useState<Record<string, PrizeData>>(() => JSON.parse(JSON.stringify(data)));
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editingSub, setEditingSub] = useState({ catKey: null as string | null, subIdx: null as number | null, value: '' });
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newSubLabel, setNewSubLabel] = useState('');
  const [addingSubTo, setAddingSubTo] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: string; key: string; subIdx?: number } | null>(null);

  const catKeys = Object.keys(localData);
  
  const updateCat = (key: string, updates: Partial<PrizeData>) => {
    setLocalData(prev => ({ ...prev, [key]: { ...prev[key], ...updates } }));
  };
  
  const addCategory = () => {
    if (!newCatLabel.trim()) return;
    const key = 'cat_' + Date.now();
    setLocalData(prev => ({ ...prev, [key]: { label: newCatLabel.trim(), icon: 'star', subs: [] } }));
    setNewCatLabel('');
  };
  
  const addSub = (catKey: string) => {
    if (!newSubLabel.trim()) return;
    const subs = [...localData[catKey].subs, { value: 'sub_' + Date.now(), label: newSubLabel.trim() }];
    updateCat(catKey, { subs });
    setNewSubLabel('');
    setAddingSubTo(null);
  };
  
  const removeSub = (catKey: string, idx: number) => {
    const subs = localData[catKey].subs.filter((_, i) => i !== idx);
    updateCat(catKey, { subs });
  };
  
  const removeCat = (key: string) => {
    const copy = { ...localData };
    delete copy[key];
    setLocalData(copy);
    setConfirmDelete(null);
  };

  return (
    <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
      {catKeys.map(key => (
        <div key={key} style={{ marginBottom: '16px', padding: '12px', border: '1.5px solid var(--animal-border)', borderRadius: 'var(--animal-radius-lg)', background: 'var(--animal-bg-input)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            {editingCat === key ? (
              <>
                <Input value={localData[key].label} onChange={(e: any) => updateCat(key, { label: e.target.value })} style={{ flex: 1 }} />
                <Button size="small" onClick={() => setEditingCat(null)}>完成</Button>
              </>
            ) : (
              <>
                <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--animal-text)', flex: 1 }}>{localData[key].label}</span>
                <Button size="small" onClick={() => setEditingCat(key)}>编辑</Button>
                <Button size="small" danger onClick={() => setConfirmDelete({ type: 'cat', key })}>删除</Button>
              </>
            )}
          </div>
          <div style={{ paddingLeft: '12px' }}>
            {localData[key].subs.map((sub, idx) => (
              <div key={sub.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                {editingSub.catKey === key && editingSub.subIdx === idx ? (
                  <>
                    <Input value={editingSub.value} onChange={(e: any) => setEditingSub({ ...editingSub, value: e.target.value })} style={{ flex: 1 }} />
                    <Button size="small" onClick={() => {
                      const subs = localData[key].subs.map((s, i) => i === idx ? { ...s, label: editingSub.value } : s);
                      updateCat(key, { subs });
                      setEditingSub({ catKey: null, subIdx: null, value: '' });
                    }}>完成</Button>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: '14px', color: 'var(--animal-text-body)', flex: 1 }}>{sub.label}</span>
                    <Button size="small" onClick={() => setEditingSub({ catKey: key, subIdx: idx, value: sub.label })}>编辑</Button>
                    <Button size="small" danger onClick={() => removeSub(key, idx)}>删除</Button>
                  </>
                )}
              </div>
            ))}
            {addingSubTo === key ? (
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <Input value={newSubLabel} onChange={(e: any) => setNewSubLabel(e.target.value)} placeholder="子类名称" style={{ flex: 1 }} />
                <Button size="small" onClick={() => addSub(key)}>添加</Button>
                <Button size="small" onClick={() => { setAddingSubTo(null); setNewSubLabel(''); }}>取消</Button>
              </div>
            ) : (
              <Button size="small" onClick={() => setAddingSubTo(key)} style={{ marginTop: '6px' }}>+ 添加子类</Button>
            )}
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', padding: '12px', border: '1.5px dashed var(--animal-border)', borderRadius: 'var(--animal-radius-lg)' }}>
        <Input value={newCatLabel} onChange={(e: any) => setNewCatLabel(e.target.value)} placeholder="新大类名称" style={{ flex: 1 }} />
        <Button size="small" onClick={addCategory}>+ 添加大类</Button>
      </div>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '8px' }}>
        <Button type="primary" onClick={() => { onSave(localData); }}>保存更改</Button>
        <Button onClick={onClose}>取消</Button>
      </div>

      {confirmDelete && (
        <Modal open={true} title="确认删除"
          onClose={() => setConfirmDelete(null)}
          onOk={() => {
            if (confirmDelete.type === 'cat') removeCat(confirmDelete.key);
            setConfirmDelete(null);
          }}>
          {confirmDelete.type === 'cat'
            ? `确定要删除大类「${localData[confirmDelete.key]?.label}」吗？该大类下的所有子类也会被删除，且已填写的问卷中引用该类别的数据将失效。`
            : '确定要删除这个子类吗？'}
        </Modal>
      )}
    </div>
  );
}
