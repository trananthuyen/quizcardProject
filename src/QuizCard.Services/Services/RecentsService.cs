using QuizCard.Entities;
using QuizCard.RepositoryContracts;
using QuizCard.ServiceContracts;
using QuizCard.ServiceContracts.DTOs.RecentDTOs;

namespace QuizCard.Services.Services;

public class RecentsService : IRecentsService
{
    private readonly IRecentsRepository _recentsRepository;
    private readonly IDecksRespository _decksRepository;
    private readonly IUsersRepository _usersRepository;

    public RecentsService(
        IRecentsRepository recentsRepository,
        IDecksRespository decksRepository,
        IUsersRepository usersRepository)
    {
        _recentsRepository = recentsRepository;
        _decksRepository = decksRepository;
        _usersRepository = usersRepository;
    }

    public async Task<List<RecentDeckDto>> GetRecentsAsync(Guid? userId, int limit = 50)
    {
        var recents = await _recentsRepository.GetRecentsAsync(userId, limit);
        var dtos = new List<RecentDeckDto>();

        foreach (var r in recents)
        {
            if (r.Deck == null) continue;

            string? creatorName = null;
            if (r.Deck.UserId.HasValue)
            {
                var user = await _usersRepository.GetByIdAsync(r.Deck.UserId.Value);
                creatorName = user?.FullName ?? user?.UserName;
            }

            dtos.Add(new RecentDeckDto(
                Id: r.Id,
                DeckId: r.DeckId,
                Title: r.Deck.Title,
                Description: r.Deck.Description,
                Folder: r.Deck.Folder,
                Tag: r.Deck.Tag,
                IsPublic: r.Deck.IsPublic,
                TotalCards: r.Deck.Cards?.Count ?? 0,
                ActionType: r.ActionType,
                LastAccessedAt: r.LastAccessedAt,
                CreatorUserId: r.Deck.UserId,
                CreatorName: creatorName
            ));
        }

        return dtos;
    }

    public async Task<RecentDeckDto> RecordRecentAsync(Guid deckId, Guid? userId, string? actionType)
    {
        var recent = await _recentsRepository.AddOrUpdateRecentAsync(userId, deckId, actionType ?? "VIEW");
        var deck = await _decksRepository.GetDeckById(deckId);

        string? creatorName = null;
        if (deck?.UserId.HasValue == true)
        {
            var user = await _usersRepository.GetByIdAsync(deck.UserId.Value);
            creatorName = user?.FullName ?? user?.UserName;
        }

        return new RecentDeckDto(
            Id: recent.Id,
            DeckId: recent.DeckId,
            Title: deck?.Title ?? "Bộ thẻ",
            Description: deck?.Description,
            Folder: deck?.Folder ?? "Chung",
            Tag: deck?.Tag,
            IsPublic: deck?.IsPublic ?? true,
            TotalCards: deck?.Cards?.Count ?? 0,
            ActionType: recent.ActionType,
            LastAccessedAt: recent.LastAccessedAt,
            CreatorUserId: deck?.UserId,
            CreatorName: creatorName
        );
    }

    public Task<bool> RemoveRecentAsync(Guid recentId, Guid? userId)
    {
        return _recentsRepository.DeleteRecentAsync(recentId, userId);
    }

    public Task<bool> RemoveRecentByDeckAsync(Guid deckId, Guid? userId)
    {
        return _recentsRepository.DeleteRecentByDeckAsync(deckId, userId);
    }

    public Task<bool> ClearAllRecentsAsync(Guid? userId)
    {
        return _recentsRepository.ClearAllRecentsAsync(userId);
    }
}

