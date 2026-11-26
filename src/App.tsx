import { useEffect, useMemo, useState } from 'react';
import { CollageBackdrop } from './components/CollageBackdrop';
import { GuideModal } from './components/GuideModal';
import { Header } from './components/Header';
import { HomeTab } from './components/HomeTab';
import { MapTab } from './components/MapTab';
import { ProjectModal } from './components/ProjectModal';
import { SetupTab } from './components/SetupTab';
import { WorkspaceTab } from './components/WorkspaceTab';
import { createBlankProject, createDemoProject } from './data/demoProject';
import type { AIModelTarget, MainTab, WayfinderProject, WayfinderStore } from './types/wayfinder';
import {
  calculateSafeZoneStats,
  claimTicketInProject,
  releaseTicketInProject,
} from './utils/mapLogic';
import { loadStoreFromStorage, saveStoreToStorage } from './utils/storage';

export default function App() {
  const [store, setStore] = useState<WayfinderStore>(() => {
    const initial = loadStoreFromStorage();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        return { ...initial, activeTab: 'map' };
      }
    }
    return initial;
  });
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  useEffect(() => {
    saveStoreToStorage(store);
  }, [store]);

  const activeProject = useMemo(
    () =>
      store.projects.find((p) => p.id === store.activeProjectId) ?? store.projects[0],
    [store.projects, store.activeProjectId]
  );

  const stats = useMemo(() => calculateSafeZoneStats(activeProject), [activeProject]);

  function updateActiveProject(updater: (proj: WayfinderProject) => WayfinderProject) {
    setStore((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === activeProject.id ? updater(p) : p)),
    }));
  }

  function handleSelectProject(projectId: string) {
    setStore((prev) => ({
      ...prev,
      activeProjectId: projectId,
    }));
  }

  function handleCreateProject(name: string, withDemo: boolean) {
    const newProj = withDemo
      ? {
          ...createDemoProject(),
          id: `demo-${Date.now().toString(36)}`,
          name,
          updatedAt: new Date().toISOString(),
        }
      : createBlankProject(name);

    setStore((prev) => ({
      ...prev,
      projects: [newProj, ...prev.projects],
      activeProjectId: newProj.id,
      activeTab: withDemo ? 'map' : 'setup',
    }));
    setIsProjectModalOpen(false);
  }

  function handleRenameProject(projectId: string, newName: string) {
    setStore((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === projectId
          ? { ...p, name: newName, updatedAt: new Date().toISOString() }
          : p
      ),
    }));
  }

  function handleDeleteProject(projectId: string) {
    setStore((prev) => {
      if (prev.projects.length <= 1) return prev;
      const remaining = prev.projects.filter((p) => p.id !== projectId);
      const nextActive =
        prev.activeProjectId === projectId ? remaining[0].id : prev.activeProjectId;
      return {
        ...prev,
        projects: remaining,
        activeProjectId: nextActive,
      };
    });
  }

  function handleImportProjects(
    imported: WayfinderProject[],
    targetAi?: AIModelTarget
  ) {
    setStore((prev) => {
      const existingIds = new Set(prev.projects.map((p) => p.id));
      const normalized = imported.map((p) =>
        existingIds.has(p.id)
          ? { ...p, id: `${p.id}-${Date.now().toString(36)}` }
          : p
      );
      return {
        ...prev,
        projects: [...normalized, ...prev.projects],
        activeProjectId: normalized[0]?.id ?? prev.activeProjectId,
        targetAi: targetAi ?? prev.targetAi,
        activeTab: 'map',
      };
    });
  }

  function handleClaimTicket(ticketId: number) {
    updateActiveProject((proj) => claimTicketInProject(proj, ticketId));
    setStore((prev) => ({ ...prev, activeTab: 'workspace' }));
  }

  function handleReleaseTicket(ticketId: number) {
    updateActiveProject((proj) => releaseTicketInProject(proj, ticketId));
  }

  function handleChangeTab(tab: MainTab) {
    setStore((prev) => ({ ...prev, activeTab: tab }));
  }

  function handleChangeTargetAi(targetAi: AIModelTarget) {
    setStore((prev) => ({ ...prev, targetAi }));
  }

  return (
    <div className="relative min-h-screen flex flex-col text-[#111111]">
      <CollageBackdrop />

      <Header
        projects={store.projects}
        activeProject={activeProject}
        targetAi={store.targetAi}
        activeTab={store.activeTab}
        stats={stats}
        onSelectProject={handleSelectProject}
        onOpenProjectModal={() => setIsProjectModalOpen(true)}
        onChangeTargetAi={handleChangeTargetAi}
        onChangeTab={handleChangeTab}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      <main className="relative z-10 flex-1 max-w-[1140px] w-full mx-auto px-4 sm:px-6 py-5 sm:py-7">
        {store.activeTab === 'home' && (
          <HomeTab
            activeProject={activeProject}
            targetAi={store.targetAi}
            stats={stats}
            onOpenMap={() => handleChangeTab('map')}
            onStartNewProject={() => setIsProjectModalOpen(true)}
            onOpenSetup={() => handleChangeTab('setup')}
            onChangeTargetAi={handleChangeTargetAi}
          />
        )}

        {store.activeTab === 'setup' && (
          <SetupTab
            project={activeProject}
            targetAi={store.targetAi}
            onUpdateProject={updateActiveProject}
            onGoToMap={() => handleChangeTab('map')}
          />
        )}

        {store.activeTab === 'map' && (
          <MapTab
            project={activeProject}
            onClaimTicket={handleClaimTicket}
            onUpdateProject={updateActiveProject}
            onGoToSetup={() => handleChangeTab('setup')}
          />
        )}

        {store.activeTab === 'workspace' && (
          <WorkspaceTab
            project={activeProject}
            targetAi={store.targetAi}
            onClaimTicket={handleClaimTicket}
            onReleaseTicket={handleReleaseTicket}
            onUpdateProject={updateActiveProject}
            onGoToMap={() => handleChangeTab('map')}
          />
        )}
      </main>

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        store={store}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onRenameProject={handleRenameProject}
        onDeleteProject={handleDeleteProject}
        onImportProjects={handleImportProjects}
      />

      <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );
}
