using QuizCard.Repositories;
using QuizCard.RepositoryContracts;
using QuizCard.ServiceContracts;
using QuizCard.Services;
using QuizCard.Services.Services;

namespace QuizCard.UI.StartupExtensions;

public static class ConfigureServicesExtension
{
    public static IServiceCollection ConfigureService(this IServiceCollection services, IConfiguration configuration)
    {
        // Đăng ký tầng Repositories (Data Access Layer - Clean Architecture)
        services.AddScoped<ICardsRespository, CardsRespository>();
        services.AddScoped<IDecksRespository, DecksRespository>();
        services.AddScoped<ICategoriesRespository, CategoriesRespository>();
        services.AddScoped<IStudyProgressesRespository, StudyProgressesRespository>();

        // Đăng ký các tầng nghiệp vụ (Business Services) theo vòng đời Scoped:
        // - IDeckService     -> DeckService     (Xử lý CRUD bộ thẻ)
        // - ICardService     -> CardService     (Xử lý CRUD thẻ, tạo thẻ từ chuỗi)
        // - IStudyService    -> StudyService    (Xử lý thuật toán Spaced Repetition, phiên học, trắc nghiệm)
        // - ICategoryService -> CategoryService (Xử lý CRUD phân loại bộ thẻ)
        // - ITtsService      -> TtsService      (Xử lý phát âm từ vựng bên thứ 3)
        services.AddScoped<IDeckService, DeckService>();
        services.AddScoped<ICardService, CardService>();
        services.AddScoped<IStudyService, StudyService>();
        services.AddScoped<ICategoryService, CategoryService>();
        services.AddSingleton<ITtsService, TtsService>();

        return services;
    }
}

