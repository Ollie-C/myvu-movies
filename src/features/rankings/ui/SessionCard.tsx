import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  BarChart3,
  FolderPlus,
  Trash2,
  MoreHorizontal,
  Edit2,
  Check,
  X,
} from 'lucide-react';

// Components
import { Card } from '@/shared/ui/Card';
import { MiniLeaderboard } from './MiniLeaderboard';

// Hooks
import { useRankingSession } from '@/features/rankings/api/hooks/useRankingSession';

// Contexts
import { useToast } from '@/shared/context/ToastContext';

// Schemas
import type { RankingList } from '@/features/rankings/models/ranking-list.schema';

interface SessionCardProps {
  session: RankingList;
}

export const SessionCard = ({ session }: SessionCardProps) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [showActions, setShowActions] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(session.name);
  const { pause, resume, softDelete, convertToCollection, progress, update } =
    useRankingSession(session.id);

  const handleDelete = async () => {
    if (confirm(`Delete session "${session.name}"? This cannot be undone.`)) {
      await softDelete.mutateAsync();
      showToast('success', 'Session deleted', `${session.name} removed.`);
    }
  };

  const handlePause = () => {
    pause.mutate(undefined, {
      onSuccess: () =>
        showToast('success', 'Session paused', 'You can resume at any time.'),
    });
  };

  const handleResume = () => {
    resume.mutate(undefined, {
      onSuccess: () => navigate(`/versus/${session.id}`),
    });
  };

  const handleSaveName = () => {
    if (editedName.trim() && editedName !== session.name) {
      update.mutate(
        { name: editedName.trim() },
        {
          onSuccess: () => {
            showToast(
              'success',
              'Name updated',
              'Session name has been changed.'
            );
            setIsEditingName(false);
          },
          onError: () => {
            showToast(
              'error',
              'Failed to update',
              'Could not change session name.'
            );
            setEditedName(session.name); // Reset on error
          },
        }
      );
    } else {
      setIsEditingName(false);
      setEditedName(session.name); // Reset if no changes
    }
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setEditedName(session.name);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const getStatusBadge = () => {
    switch (session.status) {
      case 'completed':
        return (
          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
            Completed
          </span>
        );
      case 'paused':
        return (
          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800'>
            Paused
          </span>
        );
      default:
        return (
          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
            Active
          </span>
        );
    }
  };

  const getPrimaryAction = () => {
    switch (session.status) {
      case 'completed':
        return {
          icon: BarChart3,
          label: 'View Results',
          onClick: () => navigate(`/ranking-results/${session.id}`),
        };
      case 'paused':
        return {
          icon: Play,
          label: 'Resume',
          onClick: handleResume,
        };
      default:
        return {
          icon: Play,
          label: 'Continue',
          onClick: () => navigate(`/versus/${session.id}`),
        };
    }
  };

  const primaryAction = getPrimaryAction();

  const getProgressInfo = () => {
    if (!progress.data) return null;

    const { completedBattles, targetBattles, completionPercent } =
      progress.data;

    if (session.battle_limit_type === 'infinite') {
      return `${completedBattles} battles`;
    }

    if (targetBattles) {
      return `${completedBattles}/${targetBattles} battles${
        completionPercent ? ` (${Math.round(completionPercent)}%)` : ''
      }`;
    }

    return `${completedBattles} battles`;
  };

  return (
    <Card
      className={`p-4 transition-all duration-200 group ${
        session.status === 'completed'
          ? 'bg-gradient-to-r from-gray-50 to-white'
          : ''
      }`}>
      <div className='flex items-start justify-between mb-3'>
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2 mb-1'>
            {isEditingName ? (
              <div className='flex items-center gap-1 flex-1'>
                <input
                  type='text'
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className='font-semibold text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 text-sm flex-1 min-w-0'
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className='p-1 text-green-600 hover:bg-green-50 rounded'
                  title='Save'>
                  <Check size={14} />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className='p-1 text-gray-500 hover:bg-gray-50 rounded'
                  title='Cancel'>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className='flex items-center gap-1 flex-1 min-w-0'>
                <h3 className='font-semibold text-gray-900 truncate'>
                  {session.name}
                </h3>
                <button
                  onClick={() => setIsEditingName(true)}
                  className='p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded opacity-0 group-hover:opacity-100 transition-opacity'
                  title='Edit name'>
                  <Edit2 size={12} />
                </button>
              </div>
            )}
            {getStatusBadge()}
          </div>
          <p className='text-sm text-gray-500'>
            {session.ranking_method} •{' '}
            {session.elo_handling === 'global' ? 'Global Elo' : 'Local Elo'}
            {getProgressInfo() && (
              <>
                {' • '}
                <span className='font-medium'>{getProgressInfo()}</span>
              </>
            )}
          </p>
        </div>

        <div className='flex items-center gap-1 ml-3'>
          <button
            onClick={primaryAction.onClick}
            className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors'>
            <primaryAction.icon size={14} />
            {primaryAction.label}
          </button>

          <div className='relative'>
            <button
              onClick={() => setShowActions(!showActions)}
              className='p-1.5 rounded-md hover:bg-gray-100 transition-colors'>
              <MoreHorizontal size={16} className='text-gray-500' />
            </button>

            {showActions && (
              <div className='absolute right-0 top-8 bg-white border rounded-lg shadow-lg py-1 z-10 min-w-[140px]'>
                {session.status === 'completed' && (
                  <button
                    onClick={() => {
                      convertToCollection.mutate();
                      setShowActions(false);
                    }}
                    className='flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50'>
                    <FolderPlus size={14} />
                    To Collection
                  </button>
                )}

                {session.status === 'active' && (
                  <button
                    onClick={() => {
                      handlePause();
                      setShowActions(false);
                    }}
                    className='flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50'>
                    <Pause size={14} />
                    Pause
                  </button>
                )}

                <button
                  onClick={() => {
                    handleDelete();
                    setShowActions(false);
                  }}
                  className='flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50'>
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {session.status === 'completed' && (
        <MiniLeaderboard sessionId={session.id} />
      )}
    </Card>
  );
};
