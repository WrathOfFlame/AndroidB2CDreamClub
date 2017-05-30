ons.ready(function () {
    // Настройки
    WEBPassport.Views.SettingsWidget = WEBPassport.Views.IWidget.extend({
        template: function (serialized_model) {
            return _.template($('#template_widget_settings_2_2').html())(serialized_model);
        },
        ui: {
            content_widget: "#content_widget",
        },
        initializeAfter: function (options) {
            console.log("WEBPassport.Views.SettingsWidget:initializeAfter");
        },
        events: {
            "hold": "holdMenu",
            "click": "openScreen", // перейти к форме
        },
        onRenderAfter: function () {
            console.log("WEBPassport.Views.SettingsWidget:onRenderAfter");

            return true;
        },
        // перейти к форме  ( клик на вижет)
        openScreen: function (e) {
            console.log("WEBPassport.Views.SettingsWidget:openScreen");
            // в режими редактирования ни куда не переходим
            if (!isEditDashboard)
                mobipayNavigatorOpen(
                  mobipayPage.settings,
                  "left",
                  { backgroundColor: $(this.ui.content_widget).css("background-color") }
              );
        },
    });

});
ons.ready(function () {
    //Вьюшка для страницы Settings
    WEBPassport.Views.Settings = WEBPassport.IViews.extend({
        el: "#page_settings",
        template: '#template_settings_content',
        ui: {
            back_btn: "#back_btn", // кнопка назад
            select_lang: "#select_lang", // строка выбранного языка
            version: "#version", // версия
            effects: "#effects", // эффекты
            developer_item: "#developer_item", // для разработчика
            developer: "#developer",
        },
        events: {
            'click @ui.back_btn': 'returnBeforeToMainForm', // нажатие кнопки назад

            'change @ui.effects': 'setIsEffects', // клик на поле эффекты
            'change @ui.developer': 'setIsDev', // клик на поле production
        },
        initializeAfter: function () {
            console.log("WEBPassport.Views.Settings:initializeAfter");
            this.listenTo(Backbone, "WEBPassport.Views.Settings:returnToMainForm", this.returnBeforeToMainForm);
        },
        onRender: function () {
            console.log("WEBPassport.Views.Settings:onRender");
            if (isMobile) window.analytics.trackEvent(localStorage.devType, 'win_settings', 'Settings', null);

            var $this = this;

            if (window.isDev)
                this.ui.developer_item.show();

            var model = new Backbone.Model({
                lang: window.settings.lang,
                id: "lang"
            });

            // рендерим настройки языка
            this.selectItem = new SelectItem({
                model: model,
                el: this.ui.select_lang
            });
            this.selectItem.render();

            // получаем версию приложения
            if (isMobile)
            {
                if(device.platform.toLowerCase()=='ios')
                    $this.ui.version.text(AppVersion.version + "." + AppVersion.build);
                else
                {
                    cordova.getAppVersion.getVersionNumber().then(function (version) {
                        var ver = version;
                        cordova.getAppVersion.getVersionCode().then(function (code) {
                            $this.ui.version.text(version + "." + code);
                        });
                    });
                }
            }


            if (wlPath == "MobiPay")
                $(".wl_hide").show();
            else
                $(".wl_hide").hide();

            ons.compile(this.$el.get(0));
            this.$el.i18n();
        },

        // возврат на предыдующее окно
        returnBeforeToMainForm: function () {
            console.log("WEBPassport.Views.Settings:returnBeforeToMainForm");
            if (this.selectItem.selectOptionsDialog.dialog.isShown()) {
                this.selectItem.selectOptionsDialog.dialog.hide();
                return;
            }

            var callback = function () {
                Backbone.trigger("WEBPassport.Views.Settings.Destroy");
            };

            this.returnToMainForm(callback);
        },
        setIsEffects: function(a)
        {
            console.log("WEBPassport.Views.Settings:setIsEffects");
            // сохраняем изменения
            window.settings.isEffects = this.ui.effects.prop("checked");
            localStorage[settingApp] = JSON.stringify(window.settings);

            if (window.settings.isEffects)
                $(".widget").addClass("effects");
            else
                $(".widget").removeClass("effects");
        },
        setIsDev: function (a) {
            console.log("WEBPassport.Views.Settings:setIsDev");
            // сохраняем изменения
            localStorage.isDev = !this.ui.developer.prop("checked");
            ShowLoader();
            setTimeout(function () {
                window.location.reload();
            }, 1000);
        }

    });

    // строка селекта
    var SelectItem = Marionette.ItemView.extend({
        template: '#template_settings_select_lang',
        initialize: function (options) {
            console.log("WEBPassport.Views.Settings.SelectItem:initialize id = " + options.model.get("id"));
            // уничтожить все данные
            this.listenTo(Backbone, 'WEBPassport.Views.Settings.Destroy', this.destroyView);

            // рендерим данные
            this.listenTo(Backbone, 'WEBPassport.Views.Settings.SelectItem:render_' + options.model.get("id"), this.setData);
            // закрыть диалог
            this.listenTo(Backbone, 'WEBPassport.Views.Settings.SelectItem:closeDialog_' + options.model.get("id"), this.closeDialog);

            this.bindUIElements();
            var $this = this;

            ons.createDialog('template_select_dialog').then(function (dialog) {
                dialog.getDeviceBackButtonHandler().disable();

                $this.selectOptionsDialog = new SelectOptionsDialog({
                    el: dialog._element[0],
                    model: $this.model,// передаем модель
                });
                $this.selectOptionsDialog.dialog = dialog;
                $this.selectOptionsDialog.$el.i18n();
            });
        },
        setData: function (data) {
            console.log("WEBPassport.Views.Settings.SelectItem:setData");
            localStorage.lang = data.value;

            if (isMobile && (device.platform.toLowerCase() == 'android' || device.platform.toLowerCase() == "amazon-fireos"))
                window.plugins.uilanguage.switchLanguage(localStorage.lang, function (successEvent) { console.log('success language') }, function (errorEvent) { console.log('error language') });

            // сохраняем изменения
            window.settings.lang.forEach(function (a) {
                a.active = a.value == data.value ? true : false;
            });
            localStorage[settingApp] = JSON.stringify(window.settings);

            // что бы обновился язык
            setTimeout(function () {
                Backbone.trigger("WEBPassport.Views.IWidget:reRender");
            }, 500);

            Backbone.trigger('WEBPassport.Views.ModuleTagWayController:changeLanguage');

            i18n.init({ lng: localStorage.lang, resGetPath: 'js/locales/__lng__/__ns__.json', debug: true }, function (err, t) {
                $(document).i18n();
            });

            // устанавливаем активные елемент только выбранному языку
            this.model.attributes.lang.forEach(function (a) {
                a.active = a.value == data.value ? true : false;
            });

            this.render();
        },
        onBeforeRender: function () {
            console.log("WEBPassport.Views.Settings.SelectItem:onBeforeRender id = " + this.model.get("id"));

            var $this = this;

            // устанавливаем выбранный язык
            this.model.attributes.lang.forEach(function (a) {
                if(a.active)
                {
                    $this.model.attributes.selected = a;
                    return false;
                }
            });

        },
        onRender: function () {
            console.log("WEBPassport.Views.Settings.SelectItem:onRender id = " + this.model.get("id"));
            ons.compile(this.$el.get(0));
        },
        events: {
            "click": "selectOptions",
        },
        closeDialog: function () {
            console.log("WEBPassport.Views.Settings.SelectItem:closeDialog");
            this.selectOptionsDialog.dialog.hide();
        },
        selectOptions: function () {
            console.log("WEBPassport.Views.Settings.SelectItem:selectOptions");
            this.selectOptionsDialog.dialog.show();
        },
        destroyView: function () {
            console.log("WEBPassport.Views.Settings.SelectItem:destroyView");
            this.stopListening();
            this.undelegateEvents();
            this.destroy();
        },
    });

    // вьюшка диалога
    var SelectOptionsDialog = Marionette.ItemView.extend({
        ui: {
            list_options: "#list_options"
        },
        initialize: function (options) {
            console.log("WEBPassport.Views.Settings.SelectOptionsDialog:initialize " + options.model.get("id"));
            this.bindUIElements();

            $(this.el).addClass("settings");

            // уничтожить все данные
            this.listenTo(Backbone, 'WEBPassport.Views.Settings.Destroy', this.destroyView);
            // рендерим
            this.listenTo(Backbone, 'WEBPassport.Views.Settings.SelectOptionsDialog:render_' + options.model.get("id"), this.renderData);

            this.selectOptionsCollectionView = new SelectOptionsCollectionView({
                collection: new Backbone.Collection(this.model.attributes.lang),
                el: this.ui.list_options,
                selectId: this.model.attributes.id
            }).render();
        },
        renderData: function (data) {
            console.log("WEBPassport.Views.Settings.SelectOptionsDialog:renderData");

            this.selectOptionsCollectionView.collection.models.forEach(function (a) {
                 a.attributes.active = a.attributes.value == data.value ? true : false;
            });
            this.selectOptionsCollectionView.render();
        },
        destroyView: function () {
            console.log("WEBPassport.Views.Settings.SelectOptionsDialog:destroyView");
            this.stopListening();
            this.undelegateEvents();
            this.destroy();
        },
    });

    // вьюшка опций
    var SelectOptionsItem = Marionette.ItemView.extend({
        template: "#template_settings_select_options_item",
        tagName: "ons-list-item",
        attributes: {
            "modifier": "tappable",
        },
        initialize: function (options) {
            console.log("WEBPassport.Views.Settings.SelectOptionsItem:initialize id = " + options.model.get("id"));

            // уничтожить все данные
            this.listenTo(Backbone, 'WEBPassport.Views.Settings.Destroy', this.destroyView);

            this.bindUIElements();
        },
        events: {
            "click": "selectOptions",
        },
        selectOptions: function () {
            console.log("WEBPassport.Views.Settings.SelectOptionsItem:selectOptions value = " + this.model.attributes.value);

            Backbone.trigger('WEBPassport.Views.Settings.SelectItem:render_' + this.options.selectId, this.model.attributes);
            Backbone.trigger('WEBPassport.Views.Settings.SelectItem:closeDialog_' + this.options.selectId, this.model.attributes);
            Backbone.trigger('WEBPassport.Views.Settings.SelectOptionsDialog:render_' + this.options.selectId, this.model.attributes);
        },
        destroyView: function () {
            console.log("WEBPassport.Views.Settings.SelectOptionsItem:destroyView");
            this.stopListening();
            this.undelegateEvents();
            this.destroy();
        },
    });

    // коллекция опций
    var SelectOptionsCollectionView = Marionette.CollectionView.extend({
        childView: SelectOptionsItem,
        onRender: function () {
            console.log("WEBPassport.Views.Settings.SelectOptionsCollectionView:onRender");
            ons.compile(this.$el.get(0));
        },
        childViewOptions: function (model) {
            return {
                selectId: this.options.selectId
            }
        }
    });
});
ons.ready(function () {
    // Telegram
    WEBPassport.Views.TelegramWidget = WEBPassport.Views.IWidget.extend({
        template: function (serialized_model) {
            return _.template($('#template_widget_telegram_2_2').html())(serialized_model);
        },
        ui: {
            content_widget: "#content_widget",
        },
        initializeAfter: function (options) {
            console.log("WEBPassport.Views.TelegramWidget:initializeAfter");
        },
        events: {
            "hold": "holdMenu",
            "click": "openScreen", // перейти к форме
        },
        onRenderAfter: function () {
            console.log("WEBPassport.Views.TelegramWidget:onRenderAfter");

            return true;
        },
        // перейти к форме  ( клик на вижет)
        openScreen: function (e) {
            console.log("WEBPassport.Views.TelegramWidget:openScreen");
            //effectOpenScreen(this.ui.content_widget);

            // в режими редактирования ни куда не переходим
            if (!isEditDashboard)
                Backbone.trigger('WEBPassport.Views.ModuleTelegramController:openFrame');
            //   setTimeout(function () { mobipayNavigatorOpen(mobipayPage.webpassport, 'none'); }, timeoutAnimate);
        },
    });

});
ons.ready(function () {
    // Balance Promo
    WEBPassport.Views.BalancePromoWidget = WEBPassport.Views.IWidget.extend({
        template: function (serialized_model) {
            var size_y = serialized_model.type.size_y;
            var size_x = serialized_model.type.size_x;

            if (size_x == 2 && size_y == 2)
                return _.template($('#template_widget_wallet_2_2').html())(serialized_model);
            if (size_x == 2 && size_y == 3 || size_x == 2 && size_y == 4)
                return _.template($('#template_widget_wallet_tmpl_2').html())(serialized_model);
            else
                return _.template($('#template_widget_wallet_tmpl_1').html())(serialized_model);
        },
        ui: {
            content_widget: "#content_widget",
            balance_value: "#balance_value", // поле содержащие сумму кошелька
            resp_mark: "#resp_mark", // поле валюты
        },
        initializeAfter: function (options) {
            console.log("WEBPassport.Views.BalancePromoWidget:initializeAfter");
            _.bindAll(this, 'onGetBalanceSuccess');
        },
        events: {
            "hold": "holdMenu",
            "click": "openScreen", // перейти к форме
        },
        clearAll: function () {
            console.log("WEBPassport.Views.BalancePromoWidget:clearAll");

            clearInterval(this.intervalUpdateInfo);
            this.stopListening();
            this.undelegateEvents();
            this.destroy();

        },
        onRenderAfter: function () {
            console.log("WEBPassport.Views.BalancePromoWidget:onRenderAfter");
            var $this = this;

            // удаляем интервал обновления кошелька
            if ($this.intervalUpdateInfo)
                clearInterval($this.intervalUpdateInfo);

            // получаем настройки
            var settings = getWSettings($this.model.attributes);

            var size_y = $this.model.attributes.type.size_y;
            var size_x = $this.model.attributes.type.size_x;

            // функционал для размера 2х3
            if (!(size_y == 2 && size_x == 2)) {
                // обновляем кошелек с заданным интервалом
                $this.intervalUpdateInfo = setInterval(function () {
                    $this.updateInfo();
                }, settings.updateInterval);

                $this.updateInfo();
            }
            else if ($this.model.attributes.type.size_y == 2)
            { }

            return true;
        },
        // обновляем кошелек
        updateInfo: function () {
            console.log("WEBPassport.Views.BalancePromoWidget:updateInfo");

            // если объект дом удален
            if (jQuery.type(this.ui.resp_mark) == "string") {
                clearInterval(this.intervalUpdateInfo);
                return;
            }

            // отправка запроса
            WEBPassport.requestModel.getBalancePromo(this.onGetBalanceSuccess);

        },
        onGetBalanceSuccess: function (model, response, options) {
            console.log("WEBPassport.Views.BalancePromoWidget:onGetBalanceSuccess");

            // TODO: currency
            this.ui.resp_mark.text(response.data.currency);
            this.ui.balance_value.text(response.data.balance);
            Backbone.trigger("WEBPassport.Views.BalancePromo:BalancePromoHeader", response.data.balance)
            //s  this.ui.balance_value.unmask().mask("# ##0.00", { reverse: true });
        },
        onGetBalanceError: function (model, response, options) {
            console.log("WEBPassport.Views.BalancePromoWidget:onGetBalanceError response.responseText = " + response.responseText);
        },

        // обновление данных виджета
        updateWidget: function () {
            console.log("WEBPassport.Views.BalancePromoWidget:updateWidget");
            this.updateInfo();
        },

        // настройки виджета
        settingsWidget: function () {
            console.log("WEBPassport.Views.BalancePromoWidget:settingsWidget");
            var $this = this;

            if (!$this.settingsDialog) {
                // создание окна настроек
                ons.createDialog('template_widget_wallet_settings').then(function (dialog) {
                    $this.settingsDialog = dialog;

                    $this.walletWidgetSetting = new WEBPassport.Views.WalletWidgetSetting({
                        el: $this.settingsDialog._element[0],
                        dialog: $this.settingsDialog,
                        settings: getWSettings($this.model.attributes),
                        widgetId: $this.model.attributes.id
                    });


                    $this.settingsDialog.show();
                    $this.walletWidgetSetting.$el.i18n();
                });
            }
            else
                $this.settingsDialog.show();
        },

        // перейти к форме  ( клик на вижет)
        openScreen: function () {
            // в режими редактирования ни куда не переходим

            if (!isEditDashboard) {
                mobipayNavigatorOpen(
                       mobipayPage.balance_promo,
                       "left",
                       {
                           backgroundColor: $(this.ui.content_widget).css("background-color"),
                           activateTab: 0
                       }
                   );
            }
        },
    });
});
ons.ready(function () {
    //Вьюшка для страницы BalancePromo
    WEBPassport.Views.BalancePromo = WEBPassport.IViews.extend({
        el: "#page_balance_promo",
        template: '#template_balance_promo_content',
        ui: {
            top_tab_bar_balance_promo: "#top_tab_bar_balance_promo", //верхний таб бар
            row_body: "#row_body", // основной контент
            back_btn: "#back_btn", // кнопка назад
            info_btn: "#info_btn", //кнопка вызова справки
            balance_promo_header: "#balance_promo_header", // баланс промо хеадер

            tab_balance_promo: "#tab_balance_promo", // вкладка Кошелек
            tab_transfer: "#tab_transfer", // вкладка Перевести

            item_1: "#item_1", //карусель страница 1
            item_2: "#item_2", //карусель страница 2

            // headerMenu: "#headerMenu", // кнопка вызова меню (справа)
        },
        events: {
            'click @ui.back_btn': 'returnBeforeToMainForm', // нажатие кнопки назад

            'click @ui.tab_balance_promo': 'goToTabWallet', // нажатие на вкладку Кошелек
            'click @ui.tab_transfer': 'goToTabTransfer', // нажатие на вкладку Перевести
            'click @ui.info_btn': 'openHalp', // нажатие кнопки справа
        },

        // клик по кнопка помощь
        openHalp: function () {
            console.log("WEBPassport.Views.BalancePromo:openHalp");

            mobipayNavigatorOpen(mobipayPage.halp, "lift", {
                info_text: i18n.t('wbs_info_balancebonuses_dream'),
                backgroundColor: this.model.attributes.backgroundColor
            });
        },

        // возврат на предыдующее окно
        returnBeforeToMainForm: function () {

            //if (this.Transfer_Item && this.Transfer_Item.selectOptionsDialog.dialog.isShown()) {
            //    this.Transfer_Item.selectOptionsDialog.dialog.hide();
            //    return;
            //}
            var callback = function () {
                Backbone.trigger("WEBPassport.Views.BalancePromo:clearAll");
            };

            this.returnToMainForm(callback);
        },

        initializeAfter: function () {
            console.log("WEBPassport.Views.BalancePromo:initializeAfter");
            this.listenTo(Backbone, "WEBPassport.Views.BalancePromo:returnToMainForm", this.returnBeforeToMainForm);
            this.listenTo(Backbone, "WEBPassport.Views.BalancePromo:BalancePromoHeader", this.balancePromoHeader);


            //  рендерим вьюшку бокового правого меню
            // Backbone.trigger('WEBPassport.Views.MainView:renderContextMenu', WEBPassport.Views.ProfileMenu);
        },
        onRender: function () {
            console.log("WEBPassport.Views.BalancePromo:onRender");
            if (isMobile) window.analytics.trackEvent(localStorage.devType, 'win_monexy', 'Purse button', null);

            var $this = this;

            $this.isLock = true;
            setTimeout(function () {

                $this.Wallet_Item = new Wallet_Item({
                    model: WEBPassport.mainViewModel,
                    el: $this.ui.item_1
                }).render();

                $this.Transfer_Item = new Transfer_Item({
                    model: WEBPassport.mainViewModel,
                    el: $this.ui.item_2
                }).render();


                //caruselBalancePromo.setActiveCarouselItemIndex($this.model.attributes.activateTab);
                if ($this.model.attributes.activateTab == 1)
                    $this.ui.tab_transfer.click();

                $this.isLock = false;
            }, window.settings.isEffects ? timeoutRender : 0);

            ons.compile(this.$el.get(0));
            this.$el.i18n();
            this.updateCSS();
        },

        // клик по меню (справа) открыть
        //openMenu: function () {
        //    console.log("WEBPassport.Views.BalancePromo:openMenu");
        //    Backbone.trigger("WEBPassport.Views.MainView:openMenu");
        //},

        //TODO: сделать листание свайпом карусели
        // ons-carousel swipeable
        // нажатие на вкладку Кошелек
        goToTabWallet: function () {
            console.log("WEBPassport.Views.BalancePromo:goToTabWallet");
            caruselBalancePromo.setActiveCarouselItemIndex(0);
            // if (isMobile) window.analytics.trackEvent(localStorage.devType, 'win_monexy', 'MoneXy Purse', null);
        },

        // нажатие на вкладку Перевести
        goToTabTransfer: function () {
            console.log("WEBPassport.Views.BalancePromo:goToTabTransfer");
            caruselBalancePromo.setActiveCarouselItemIndex(1);
            //  if (isMobile) window.analytics.trackEvent(localStorage.devType, 'win_monexy', 'MoneXy Tab Translate', null);
        },

        updateCSS: function () {
            console.log("WEBPassport.Views.BalancePromo:updateCSS");
            var a = window.innerHeight - this.ui.top_tab_bar_balance_promo.outerHeight(true) - $(this.el).find("ons-toolbar").outerHeight(true);
            this.ui.row_body.css("height", a + "px");
        },

        balancePromoHeader: function (balance) {
            console.log("WEBPassport.Views.BalancePromo:balancePromoHeader");
            window.balance_promo_header = balance;

            if (this.ui.balance_promo_header.length != 0) {
                this.ui.balance_promo_header.text(balance)
            }
        },
    });

    // виьшка вкладки КОШЕЛЕК
    var Wallet_Item = Marionette.ItemView.extend({
        template: '#template_balance_promo_refill_item',
        className: "history-item",
        ui: {
            resp_mark: "#resp_mark", // валюта
            balance_value: "#balance_value", // баланс
            history_balance_promo: "#history_balance_promo", // лист истории
            emptyList: "#emptyList"
        },
        initialize: function () {
            console.log("WEBPassport.Views.BalancePromo.Wallet_Item:initialize");

            // для обновления кошелька
            this.listenTo(Backbone, "WEBPassport.Views.BalancePromo.Wallet_Item:updateWallet", this.updateWallet);

            // для обновления истории
            this.listenTo(Backbone, "WEBPassport.Views.BalancePromo.Wallet_Item:updateHistory", this.updateHistory);

            // для уничтожения полностью страницы кошелька
            this.listenTo(Backbone, 'WEBPassport.Views.BalancePromo:clearAll', this.clearAll);

            _.bindAll(this, "onSuccessAfter");
        },
        onRender: function () {
            console.log("WEBPassport.Views.BalancePromo.Wallet_Item:onRender");
            var $this = this;

            $this.updateWallet();
            $this.updateHistory();

            ons.compile(this.$el.get(0));
            this.$el.i18n();
        },

        // обновить баланс
        updateWallet: function () {
            console.log("WEBPassport.Views.BalancePromo.Wallet_Item:updateWallet");
            ShowLoader();
            // отправка запроса
            WEBPassport.requestModel.getBalancePromo(this.onSuccessAfter, { type: 'updateWallet' });
        },

        // обновить историю
        updateHistory: function () {
            var dateFrom = "";
            var dateTo = "";
            var payment = 1;//2;
            var page = 0;
            var rows = 20;
            var currency = "RPO";//this.model.attributes.mobile.toString().substr(0, 3) == "380" ? "UAH" : "EUR";

            // отправка запроса
            WEBPassport.requestModel.getTransactionsHistory(this.onSuccessAfter, { type: 'updateHistory' }, null);
        },

        onSuccessAfter: function (model, response, options) {
            console.log("WEBPassport.Views.BalancePromo.Wallet_Item:onSuccessAfter");
            console.log("WEBPassport.Views.BalancePromo.Wallet_Item:onSuccessAfter response.json" + JSON.stringify(response.data));
            console.log("WEBPassport.Views.BalancePromo.Wallet_Item:onSuccessAfter type = " + options.obj.type);
            HideLoader();
            // если объект дом удален
            if (jQuery.type(this.ui.resp_mark) == "string") return;

            if (options.obj.type == "updateWallet") {
                this.ui.resp_mark.text(response.data.currency);
                this.ui.balance_value.text(response.data.balance);
                Backbone.trigger("WEBPassport.Views.BalancePromo:BalancePromoHeader", response.data.balance)
                //  this.ui.balance_value.unmask().mask("# ##0.00", { reverse: true });
            }
            else if (options.obj.type == "updateHistory") {
                console.log("WEBPassport.Views.BalancePromo.Wallet_Item:onSuccessAfter.updateHistory operations = ");

                var list = response.data.transactions;
                var newList = new Array();
                var dateGroup;

                if (list && list.length > 0) {
                    this.ui.history_balance_promo.show();
                    this.ui.emptyList.hide();

					list.sort(function(a, b)
					{
						var a_date = a.transaction_date + " " + a.transaction_time;
                        a_date = moment(a_date, "YYYY-MM-DD HH:mm:ss");
						var b_date = b.transaction_date + " " + b.transaction_time;
						b_date = moment(b_date, "YYYY-MM-DD HH:mm:ss");
						return (a_date === b_date) ? 0 : (a_date < b_date) ? 1 : -1;
					});

                    list.forEach(function (a, i)
					{
                        a.date = a.transaction_date + " " + a.transaction_time;
                        var date = moment(a.date, "YYYY-MM-DD HH:mm:ss").format("DD-MM-YYYY");
                        a.currency = response.data.currency;

                        if (!dateGroup) {
                            newList.push({ date: a.date, type: "header" })
                            dateGroup = date;
                        }

                        if (dateGroup != date) {
                            newList.push({ date: a.date, type: "header" })
                            dateGroup = date
                        }
                        newList.push(a);
                    });

                    // рендерим страницы карусели и виджеты на ней
                    if (this.balance_promoHistoryCollectionView) {
                        this.balance_promoHistoryCollectionView.destroyChildren();
                        this.balance_promoHistoryCollectionView.collection = new Backbone.Collection(newList);
                        this.balance_promoHistoryCollectionView.render();
                    }
                    else {
                        this.balance_promoHistoryCollectionView = new WalletHistoryCollectionView({
                            collection: new Backbone.Collection(newList),
                            el: this.ui.history_balance_promo
                        }).render();
                    }
                }
                else {
                    this.ui.history_balance_promo.hide();
                    this.ui.emptyList.show();
                }
            }
        },
        clearAll: function () {
            console.log("WEBPassport.Views.BalancePromo.Transfer_Item:clearAll");

            this.stopListening();
            this.undelegateEvents();
            this.destroy();
        },
    });

    // вьшка для строки в списке
    var WalletHistoryItemView = Marionette.ItemView.extend({
        tagName: "ons-list-item",
        className: "history-headere-item",
        events: {
            //'click': 'toogleInfo', // клик по строке
        },
        template: '#template_balance_promo_history_item',
        ui: {
            amount: "#amount", // строка суммы
            amount_value: "#amount_value", // сумма
            user_to: "#user_to",

            inf_user_to: "#inf_user_to",
            inf_amount_value: "#inf_amount_value",
            inf_balance_value: "#inf_balance_value",

            row_history_info: "#row_history_info",
            arrow_down: "#arrow_down",
            user_to_tittle: "#user_to_tittle",
        },
        initialize: function (options) {
            // для уничтожения полностью страницы кошелька
            this.listenTo(Backbone, 'WEBPassport.Views.BalancePromo:clearAll', this.clearAll);

            //построить/привязать UI елементы
            this.bindUIElements();
        },
        onRender: function () {
            this.ui.user_to.unmask();
            if (parseInt(this.model.attributes.recipient) > 0) {
                var result = listMaskPhone.getMaskForPhoneNumber(this.model.attributes.recipient);
                if (result.mask) {
                    this.ui.user_to.val(parseInt(this.model.attributes.recipient));
                    this.ui.user_to.unmask().mask(result.mask, { 'translation': { x: { pattern: /[0-9]/ } } });

                }
            }
            // this.ui.amount_value.unmask().mask("# ##0.00", { reverse: true });
            this.$el.i18n();
        },

        // клик по строке
        toogleInfo: function () {
            console.log("WEBPassport.Views.BalancePromo.WalletHistoryItemView:toogleInfo");
            if (isMobile) window.analytics.trackEvent(localStorage.devType, 'win_monexy', 'MoneXy translation properties', null);
            this.ui.row_history_info.toggle();

            if (this.ui.arrow_down.hasClass('rotate-90'))
                this.ui.arrow_down.removeClass('rotate-90').addClass('rotate-270');
            else
                this.ui.arrow_down.removeClass('rotate-270').addClass('rotate-90');
        },
        clearAll: function () {
            console.log("WEBPassport.Views.BalancePromo.WalletHistoryItemView:clearAll");

            this.stopListening();
            this.undelegateEvents();
            this.destroy();
        },
    });

    // вьшка для заголовка с датой в списке
    var WalletHistoryHeaderItemView = Marionette.ItemView.extend({
        tagName: "ons-list-header",
        template: '#template_header_list_item',
        onBeforeRender: function () {
            var date = this.model.attributes.date;
            if (moment().format("YYYY-MM-DD") == moment(date, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD'))
                this.model.attributes.date = (i18n.t('wbs_today_label')).toLowerCase();

            else if (moment().subtract(1, 'days').format("YYYY-MM-DD") == moment(date, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD'))
                this.model.attributes.date = (i18n.t('wbs_yesterday')).toLowerCase();

            else
                this.model.attributes.date = moment(date, 'YYYY-MM-DD HH:mm:ss').format("DD MMMM, YYYY").toLowerCase();
        }
    });

    // коллекция для истории
    var WalletHistoryCollectionView = Marionette.CollectionView.extend({
        childView: WalletHistoryHeaderItemView,
        onRender: function () {
            console.log("WEBPassport.Views.WalletHistoryCollectionView:onRender");
            // ons.compile(this.$el.get(0));
            ons.compile(this.$el.get(0));
            this.$el.i18n();
        },
        getChildView: function (item) {
            if (item.attributes.type)
                return WalletHistoryHeaderItemView;
            else
                return WalletHistoryItemView;
        },
    });

    // вьюшка вкладки
    var Transfer_Item = Marionette.ItemView.extend({
        template: '#template_balance_promo_transfer_item',
        ui: {
            p2pTo_phone_input: "#p2pTo-phone-input", // номер телефона
            code_input: "#code-input", // примечание
            address_book_btn: "#address-book-btn", // кнопка телефонной книги

            pay_btn: "#pay_btn", // кнопка оплатить

            select_phone_mask: "#select_phone_mask", // кнопка выбора маски
            iso: "#iso", // iso страны
        },
        events: {
            'click @ui.address_book_btn': 'showAdressBook', // аткрыть телефонный справочник
            'click @ui.pay_btn': "onP2PWalletClick", // нажатие на кнопку оплатить
            'click @ui.select_phone_mask': 'selectPhoneMask', // клик на кнопку выбора маски
            'keyup @ui.code_input': "sendBefore", // отследить нажатие enter
        },
        initialize: function (options) {
            console.log("WEBPassport.Views.BalancePromo.Transfer_Item:initialize");

            // для установки значения кошелька
            this.listenTo(Backbone, "WEBPassport.Views.BalancePromo.Transfer_Item:updateWallet", this.updateWallet);

            // очистить форму
            this.listenTo(Backbone, "WEBPassport.Views.BalancePromo.Transfer_Item:clearForm", this.clearForm);

            // для уничтожения полностью страницы кошелька
            this.listenTo(Backbone, 'WEBPassport.Views.BalancePromo:clearAll', this.clearAll);

            _.bindAll(this, 'onP2pWalletSuccess', 'resultCall', 'setData');
            this.bindUIElements();

            // рендерим данные
            this.listenTo(Backbone, 'WEBPassport.Views.BalancePromo:render_BalancePromo', this.setData);
            var $this = this;
            //ons.createDialog('template_select_dialog').then(function (dialog) {
            //    dialog.getDeviceBackButtonHandler().disable();

            //    $this.selectOptionsDialog = new WEBPassport.Views.HelpersDropDownList({
            //        el: dialog._element[0],
            //        model: new Backbone.Model({
            //            destroyTrigger: "WEBPassport.Views.BalancePromo.Transfer_Item:clearForm",
            //            selectedTrigger: "WEBPassport.Views.BalancePromo",
            //            id: "BalancePromo",
            //            list: listMaskPhone.list,
            //            templateSelectItem: "#template_country_select_options_item"
            //        }),// передаем модель
            //    });
            //    $this.selectOptionsDialog.dialog = dialog;
            //    $this.selectOptionsDialog.$el.i18n();
            //});
        },
        onRender: function () {
            console.log("WEBPassport.Views.BalancePromo.Transfer_Item:onRender");
            var $this = this;


            //  this.setData(listMaskPhone.selectedMask);

            ons.compile(this.$el.get(0));
            this.$el.i18n();

            if (wlPath == "DreamClub")
                inpuEffects();
        },

        // клик на кнопку выбора маски
        selectPhoneMask: function () {
            console.log("WEBPassport.Views.BalancePromo:selectPhoneMask");
            if (isMobile) window.analytics.trackEvent(localStorage.devType, 'win_monexy', 'MoneXy Select country', null);
            this.selectOptionsDialog.dialog.show();
        },
        setData: function (data) {
            console.log("WEBPassport.Views.BalancePromo:setData");
            this.selectedPhoneMask = data;
            // сохраняем изменения
            listMaskPhone.setActive(data);
            if (this.selectOptionsDialog) this.selectOptionsDialog.renderData(data);

            this.ui.iso.text(data.iso);

            this.ui.p2pTo_phone_input.attr("placeholder", data.mask.replace(/x/g, "_"));
            $(this.ui.p2pTo_phone_input).inputmask('remove');

            this.ui.p2pTo_phone_input.inputmask(
             {
                 mask: data.mask,
                 placeholder: "_", greedy: false,
                 definitions: {
                     "x": {
                         validator: "[0-9]",
                         cardinality: 1,
                         definitionSymbol: "x"
                     }
                 }
             });
        },

        // открыть контакты
        showAdressBook: function () {
            console.log("WEBPassport.Views.BalancePromo.Transfer_Item:showAdressBook");

            if (isMobile) {
                window.analytics.trackEvent(localStorage.devType, 'win_monexy', 'MoneXy Phonebook', null);
                ShowAdressBook(this.ui.p2pTo_phone_input, this.setData);
            }
        },

        //получить заполдненную модель формы
        getModel: function () {
            console.log("WEBPassport.Views.BalancePromo.Transfer_Item:getModel");
            var model = {
                code: this.ui.code_input.val(),
                to: parseInt(localStorage.phone), // parseInt(this.ui.p2pTo_phone_input.val().replace(/[\(\)+\-\s\_]/g, '')),
                // isValidPhone: this.selectedPhoneMask.mask.length == this.ui.p2pTo_phone_input.val().replace(/_/g, "").length
            };

            return model;
        },

        // очистить форму
        clearForm: function () {
            console.log("WEBPassport.Views.BalancePromo.Transfer_Item:clearForm");

            this.ui.code_input.val("");
            this.ui.p2pTo_phone_input.val("");
        },

        // отследить нажатие enter
        sendBefore: function (e) {
            var $this = this;

            if (e.which == 13) {
                this.ui.code_input.focusout();
                setTimeout(function () {
                    $this.onP2PWalletClick();
                }, window.settings.isEffects ? timeoutRender : 0);
            }
        },

        // нажатие на кнопку оплатить
        onP2PWalletClick: function () {
            console.log("WEBPassport.Views.BalancePromo.Transfer_Item:onP2PWalletClick");
            if (isMobile) window.analytics.trackEvent(localStorage.devType, 'win_monexy', 'MoneXy Translate', null);

            var $this = this;
            var model = $this.getModel();
            //if (!model.isValidPhone) {
            //    ShowAlert(i18n.t("wbs_phone_number_error"));
            //    return;
            //}

            if (!model.code) {
                ShowAlert(i18n.t('wbs_p2p_monexy_error_msg'));
                return;
            }

            ShowLoader();

            // отправка запроса
            WEBPassport.requestModel.activedPromoCode(model.to, model.code, $this.onP2pWalletSuccess);
        },


        onP2pWalletSuccess: function (model, response, options) {
            console.log("WEBPassport.Views.BalancePromo.Transfer_Item:onP2pWalletSuccess");
            var $this = this;

            HideLoader();
            // если объект дом удален
            if (jQuery.type($this.ui.resp_mark) == "string") return;

            if (response.status == 201)
                ShowAlert("Код успешно активирован!");

        },

        resultCall: function (model, response, options) {
            console.log("WEBPassport.Views.BalancePromo.Transfer_Item:resultCall");
            ShowAlert(i18n.t("wbs_transfer_succees"), function () {
                Backbone.trigger("WEBPassport.Views.BalancePromo.Wallet_Item:updateWallet");
                Backbone.trigger("WEBPassport.Views.BalancePromo.Wallet_Item:updateHistory");
                Backbone.trigger("WEBPassport.Views.BalancePromo.Transfer_Item:clearForm");
            });
        },
        clearAll: function () {
            console.log("WEBPassport.Views.BalancePromo.Transfer_Item:clearAll");

            this.stopListening();
            this.undelegateEvents();
            this.destroy();
        },

    });


});


// CHANGES#RESMI

//-----------------------------------------------------------------------------
//---------------------------- СТРАНИЦА ПОДАРКОВ GIFTS ------------------------
//-----------------------------------------------------------------------------

ons.ready(function () {
    // Gifts
    WEBPassport.Views.GiftsWidget = WEBPassport.Views.IWidget.extend({
        template: function (serialized_model) {
            return _.template($('#template_widget_Gifts_2_2').html())(serialized_model);
        },
        ui: {
            content_widget: "#content_widget",
        },
        initializeAfter: function (options) {
            console.log("WEBPassport.Views.GiftsWidget:initializeAfter");
        },
        events: {
            "hold": "holdMenu",
            "click": "openScreen", // перейти к форме
        },
        clearAll: function () {
            console.log("WEBPassport.Views.GiftsWidget:clearAll");

            clearInterval(this.intervalUpdateInfo);
            this.stopListening();
            this.undelegateEvents();
            this.destroy();

        },
        onRenderAfter: function () {
            console.log("WEBPassport.Views.GiftsWidget:onRenderAfter");
            var $this = this;

            return true;
        },

        openScreen: function () {
            if (!isEditDashboard) {
                mobipayNavigatorOpen(

                       mobipayPage.gifts,
                       "left",
                       {
                           backgroundColor: "#db8458",
                           activateTab: 1
                       }
                   );
            }
        },
    });
});

ons.ready(function () {
    //Вьюшка для страницы Gifts
    WEBPassport.Views.Gifts = WEBPassport.IViews.extend({
        el: "#page_gifts",
        template: '#template_gifts_content',
        ui: {
            top_tab_bar_gifts: "#top_tab_bar_gifts", //верхний таб бар
            row_body: "#row_body", // основной контент
            back_btn: "#back_btn", // кнопка назад
            gifts_header: "#gifts_header", // баланс промо хеадер

            tab_all_gifts: "#tab_all_gifts", // вкладка Кошелек
            tab_my_gifts: "#tab_my_gifts", // вкладка Перевести

            item_1: "#item_gifts_1", //карусель страница 1
            item_2: "#item_gifts_2", //карусель страница 2

            // headerMenu: "#headerMenu", // кнопка вызова меню (справа)
        },
        events: {
            'click @ui.back_btn': 'returnBeforeToMainForm', // нажатие кнопки назад

            'click @ui.tab_all_gifts': 'goToTabAllGifts', // нажатие на вкладку Кошелек
            'click @ui.tab_my_gifts': 'goToTabMyGifts', // нажатие на вкладку Перевести
        },

        // возврат на предыдующее окно
        returnBeforeToMainForm: function ()
		{
            var callback = function () {
                Backbone.trigger("WEBPassport.Views.Gifts:clearAll");
            };

            this.returnToMainForm(callback);
        },

        initializeAfter: function () {
            console.log("WEBPassport.Views.Gifts:initializeAfter");
            this.listenTo(Backbone, "WEBPassport.Views.Gifts:returnToMainForm", this.returnBeforeToMainForm);

            //  рендерим вьюшку бокового правого меню
            // Backbone.trigger('WEBPassport.Views.MainView:renderContextMenu', WEBPassport.Views.ProfileMenu);
        },
        onRender: function () {
            console.log("WEBPassport.Views.Gifts:onRender");
            if (isMobile) window.analytics.trackEvent(localStorage.devType, 'win_monexy', 'Purse button', null);

            var $this = this;

            $this.isLock = true;
            setTimeout(function () {

                $this.All_Gifts_Item = new All_Gifts_Item({
                    model: WEBPassport.mainViewModel,
                    el: $this.ui.item_1
                }).render();

                $this.My_Gifts_Item = new My_Gifts_Item({
                    model: WEBPassport.mainViewModel,
                    el: $this.ui.item_2
                }).render();


                //caruselGifts.setActiveCarouselItemIndex($this.model.attributes.activateTab);
                $this.ui.tab_all_gifts.click();

                $this.isLock = false;
            }, window.settings.isEffects ? timeoutRender : 0);

            ons.compile(this.$el.get(0));
            this.$el.i18n();
            this.updateCSS();
        },

        // клик по меню (справа) открыть
        //openMenu: function () {
        //    console.log("WEBPassport.Views.Gifts:openMenu");
        //    Backbone.trigger("WEBPassport.Views.MainView:openMenu");
        //},

        //TODO: сделать листание свайпом карусели
        // ons-carousel swipeable
        // нажатие на вкладку Кошелек
        goToTabAllGifts: function () {
            console.log("WEBPassport.Views.Gifts:goToTabAllGifts");
            caruselGifts.setActiveCarouselItemIndex(0);
        },

        // нажатие на вкладку Перевести
        goToTabMyGifts: function () {
            console.log("WEBPassport.Views.Gifts:goToTabMyGifts");
            caruselGifts.setActiveCarouselItemIndex(1);
        },

        updateCSS: function () {
            console.log("WEBPassport.Views.Gifts:updateCSS");
            var a = window.innerHeight - this.ui.top_tab_bar_gifts.outerHeight(false) - $(this.el).find("ons-toolbar").outerHeight(false);
            document.getElementById('row_body').style.height = document.getElementById('caruselGifts').style.height = a + 'px';
        },

    });

    var test_list = 'something';
    // все подарки
    var All_Gifts_Item = Marionette.ItemView.extend({
		el: "#page_gifts",
        template: '#template_all_gifts_refill_item',
		className: "history-item",
        ui: {
			       history_all_gifts: "#history_all_gifts",
				   top_tab_bar_gifts: "#top_tab_bar_gifts",
			       emptyList: "#emptyList"
        },

        events: {
        },

        initialize: function (options) {
            console.log("WEBPassport.Views.Gifts.All_Gifts_Item:initialize");

            this.listenTo(Backbone, "WEBPassport.Views.Gifts.All_Gifts_Item:updateHistory", this.updateHistory);
            this.listenTo(Backbone, 'WEBPassport.Views.Gifts:clearAll', this.clearAll);

            _.bindAll(this, "onGetAllGiftsSuccess");
        },

        onRender: function () {
            console.log("WEBPassport.Views.Gifts.All_Gifts_Item:onRender");
            var $this = this;

			$this.updateHistory();

            ons.compile(this.$el.get(0));
            this.$el.i18n();

			this.updateCSS();
        },

		updateCSS: function () {
            console.log("WEBPassport.Views.Gifts:updateCSS");
            var a = window.innerHeight - $('#top_tab_bar_gifts').height() - $('#gifts_toolbar').height();
			console.log( "height: " + a + ', tabs: ' + $('#top_tab_bar_gifts').height() + ', toolbar: ' + $('#gifts_toolbar').height() );
            document.getElementById('caruselGifts').style.height = a + 'px';
			if(document.getElementById('history_all_gifts')) document.getElementById('history_all_gifts').style.height = a + 'px';
        },

		updateHistory: function () {
            console.log("WEBPassport.Views.Gifts.All_Gifts_Item:updateInfo");
            // отправка запроса
            WEBPassport.requestModel.getAllGifts(this.onGetAllGiftsSuccess, { type: 'updateHistory' });

            console.log("list:" + test_list);
        },

        onGetAllGiftsSuccess: function (model, response, options) {

			console.log("WEBPassport.Views.Gifts.All_Gifts_Item:onGetAllGiftsSuccess");

			if (options.obj.type == "updateHistory")
			{

				console.log("WEBPassport.Views.Gifts.All_Gifts_Item:onGetAllGiftsSuccess response.json" + JSON.stringify(response.data));
				test_list = response.data.gifts;
				var resp = new Array();

				if( test_list && test_list.length > 0 )
				{
					this.ui.history_all_gifts.show();
					this.ui.emptyList.hide();

					test_list.forEach(function (a, i) {

						console.log(a + " - " + i);
                        //console.log(JSON.stringify(a));

					});

					if (this.allGiftsHistory_CollectionView) {
						this.allGiftsHistory_CollectionView.destroyChildren();
						this.allGiftsHistory_CollectionView.collection = new Backbone.Collection(test_list);
						this.allGiftsHistory_CollectionView.render();
					}
					else {
						this.allGiftsHistory_CollectionView = new AllGiftsCollectionView({
							collection: new Backbone.Collection(test_list),
							el: this.ui.history_all_gifts
						}).render();
					}
				}
				else
				{
					this.ui.history_all_gifts.hide();
                    this.ui.emptyList.show();
				}

			}

			this.updateCSS();

        },

        onGetAllGiftsError: function (model, response, options) {
            console.log("WEBPassport.Views.Gifts.All_Gifts_Item:onGetAllGiftsError response.responseText = " + response.responseText);
        },

        clearAll: function () {
            console.log("WEBPassport.Views.Gifts.All_Gifts_Item:clearAll");

            this.stopListening();
            this.undelegateEvents();
            this.destroy();
        },
    });

	var AllGiftsCollectionView = Marionette.CollectionView.extend({
        childView: AllGiftsItemView,
		onRender: function () {
            console.log("WEBPassport.Views.AllGiftsCollectionView:onRender");
            ons.compile(this.$el.get(0));
            this.$el.i18n();
        },

        childViewOptions: function(model, index) {
            return
            {
              childIndex: index
            }
        },

        getChildView: function (item) {
            return AllGiftsItemView;
        },
    });


    var AllGiftsItemView = Marionette.ItemView.extend({
        tagName: "ons-list-item",
        className: "history-headere-item",
        events: {
		    'click' : 'showInfo'
        },
        template: '#template_all_gifts_item',
        ui: {
          logo_all_gifts_item : '#logo_all_gifts_item',
          sum_all_gifts_item : '#sum_all_gifts_item',
          title_all_gifts_item : '#title_all_gifts_item'
        },
        initialize: function (options)
		{
			console.log("WEBPassport.Views.AllGiftsCollectionView");
            // для уничтожения полностью страницы кошелька
            this.listenTo(Backbone, 'WEBPassport.Views.Gifts:clearAll', this.clearAll);
            //построить/привязать UI елементы
            this.bindUIElements();
        },
        onRender: function ()
    		{
    			  console.log("WEBPassport.Views.AllGiftsCollectionView:onRender");
            this.$el.i18n();

            if(this.model.attributes.title == "Пополнить мобильный баланс"){
              this.ui.logo_all_gifts_item.hide();
              this.ui.title_all_gifts_item.css({
                "padding" : "50px 0"
              });
              this.ui.sum_all_gifts_item.hide();
            }
        },
        clearAll: function ()
    		{
            console.log("WEBPassport.Views.Gifts.AllGiftsCollectionView:clearAll");

            this.stopListening();
            this.undelegateEvents();
            this.destroy();
        },

		showInfo: function () {
            console.log("WEBPassport.Views.Gifts.AllGiftsItemView:showInfo");

            if(this.model.attributes.title == "Пополнить мобильный баланс")
            {
                mobipayNavigatorOpen(mobipayPage.get_mobile_balance, "left", this.model.attributes);
            }
            else
            {
                mobipayNavigatorOpen(mobipayPage.gifts_item_info, "left", this.model.attributes);
            }
        }
    });

	// мои подарки
    var My_Gifts_Item = Marionette.ItemView.extend({
        template: '#template_my_gifts_refill_item',
        ui: {
            history_my_gifts: "#history_my_gifts",
            emptyList: "#emptyList"
        },
        events:
        {

        },
        initialize: function (options) {
            console.log("WEBPassport.Views.Gifts.My_Gifts_Item:initialize");

            this.listenTo(Backbone, "WEBPassport.Views.Gifts.My_Gifts_Item:updateHistory", this.updateHistory);
            this.listenTo(Backbone, 'WEBPassport.Views.Gifts:clearAll', this.clearAll);

            _.bindAll(this, "onGetMyGiftsSuccess");
        },
        onRender: function () {
            console.log("WEBPassport.Views.Gifts.My_Gifts_Item:onRender");
            var $this = this;

            $this.updateHistory();

            ons.compile(this.$el.get(0));
            this.$el.i18n();
			this.updateCSS();
        },

		updateCSS: function () {
            console.log("WEBPassport.Views.Gifts:updateCSS");
            var a = window.innerHeight - $('#top_tab_bar_gifts').height() - $('#gifts_toolbar').height();
			console.log( "height: " + a + ', tabs: ' + $('#top_tab_bar_gifts').height() + ', toolbar: ' + $('#gifts_toolbar').height() );
            document.getElementById('caruselGifts').style.height = a + 'px';
			if(document.getElementById('history_my_gifts')) document.getElementById('history_my_gifts').style.height = a + 'px';
        },

        updateHistory: function () {
                console.log("WEBPassport.Views.Gifts.My_Gifts_Item:updateInfo");
                // отправка запроса
                WEBPassport.requestModel.getMyGifts(this.onGetMyGiftsSuccess, { type: 'updateHistory' });
        },

        onGetMyGiftsSuccess: function (model, response, options) {

          console.log("WEBPassport.Views.Gifts.My_Gifts:onGetMyGiftsSuccess");

          if (options.obj.type == "updateHistory")
          {

            console.log("WEBPassport.Views.Gifts.My_Gifts_Item:onGetMyGiftsSuccess response.json" + JSON.stringify(response.data));
            var list = response.data.user_gifts;
            var resp = new Array();

            if( list && list.length > 0 )
            {
              this.ui.history_my_gifts.show();
              this.ui.emptyList.hide();

              list.forEach(function (a, i) {

                console.log(a + " - " + i);
                //console.log(JSON.stringify(a));

              });

              if (this.myGiftsHistory_CollectionView) {
                this.myGiftsHistory_CollectionView.destroyChildren();
                this.myGiftsHistory_CollectionView.collection = new Backbone.Collection(list);
                this.myGiftsHistory_CollectionView.render();
              }
              else {
                this.myGiftsHistory_CollectionView = new MyGiftsCollectionView({
                  collection: new Backbone.Collection(list),
                  el: this.ui.history_my_gifts
                }).render();
              }
            }
            else
            {
              this.ui.history_my_gifts.hide();
              this.ui.emptyList.show();
            }
          }
		  this.updateCSS();
        },

        onGetMyGiftsError: function (model, response, options) {
                console.log("WEBPassport.Views.Gifts.All_Gifts_Item:onGetAllGiftsError response.responseText = " + response.responseText);
        },


        clearAll: function () {
            console.log("WEBPassport.Views.Gifts.My_Gifts_Item:clearAll");

            this.stopListening();
            this.undelegateEvents();
            this.destroy();
        },
    });


	var MyGiftsCollectionView = Marionette.CollectionView.extend({
        childView: MyGiftsItemView,
		onRender: function () {
            console.log("WEBPassport.Views.MyGiftsCollectionView:onRender");
            ons.compile(this.$el.get(0));
            this.$el.i18n();
        },

        childViewOptions: function(model, index) {
            return
            {
              childIndex: index
            }
        },

        getChildView: function (item) {
            return MyGiftsItemView;
        },
    });


    var MyGiftsItemView = Marionette.ItemView.extend({
        tagName: "ons-list-item",
        className: "history-headere-item",
        events: {},
        template: '#template_my_gifts_item',
        ui: {
          logo_all_gifts_item : '#logo_all_gifts_item',
          sum_all_gifts_item : '#sum_all_gifts_item',
          title_all_gifts_item : '#title_all_gifts_item'
        },
        initialize: function (options)
		{
			console.log("WEBPassport.Views.MyGiftsCollectionView");
            // для уничтожения полностью страницы кошелька
            this.listenTo(Backbone, 'WEBPassport.Views.Gifts:clearAll', this.clearAll);
            //построить/привязать UI елементы
            this.bindUIElements();
        },
        onRender: function ()
    	{
    		console.log("WEBPassport.Views.MyGiftsCollectionView:onRender");
            this.$el.i18n();
        },
        clearAll: function ()
    		{
            console.log("WEBPassport.Views.Gifts.MyGiftsCollectionView:clearAll");

            this.stopListening();
            this.undelegateEvents();
            this.destroy();
        },

    });

	WEBPassport.Views.Gifts_Item_Info = WEBPassport.IViews.extend({
		el: "#page_gifts_item_info",
		template: '#template_gifts_item_info_content',
		ui: {
			top_tab_bar_gifts: "#top_tab_bar_gifts",
			back_btn: "#back_btn",
            gifts_item_info_get_gift_btn: '#gifts_item_info_get_gift_btn',
		},
		events: {
            'click @ui.gifts_item_info_get_gift_btn': 'purchaseGift',
			'click @ui.back_btn': 'returnBackToMainForm',
		},
		initializeAfter: function () {
			console.log("WEBPassport.Views.Gifts_Item_Info:initializeAfter");
			this.listenTo(Backbone, "WEBPassport.Views.Gifts_Item_Info:returnToMainForm", this.returnToMainForm);
			this.listenTo(Backbone, "WEBPassport.Views.BalanceBonuses:balanceBonusHeader", this.balanceBonusHeader);
			// _.bindAll(this, "onSuccessAfter");
		},
		onRender: function () {
			console.log("WEBPassport.Views.Gifts_Item_Info:onRender");

			ons.compile(this.$el.get(0));
			this.$el.i18n();
			this.updateCSS();
		},

		// возврат на предыдующее окно
		returnBackToMainForm: function ()
		{
			this.returnToMainForm();
		},

		purchaseGift: function()
		{
			console.log("gift_id" + this.model.attributes.id);
			WEBPassport.requestModel.purchaseGift(this.model.attributes.id, this.onPurchaseGiftSuccess);
		},

		onPurchaseGiftSuccess: function (model, response, options) {

				console.log("WEBPassport.Views.MyWallets.Transfer_Bonuses_Item:onMyWalletsTransferSuccess");

				var $this = this;

				HideLoader();

				if (response.status == 201)
				{
					ShowAlert("Получение успешно выполнено!");
				}
		  },

		updateCSS: function () {
			console.log("WEBPassport.Views.Gifts_Item_Info:updateCSS");
			var a = window.innerHeight - this.ui.top_tab_bar_gifts.outerHeight(false) - $(this.el).find("ons-toolbar").outerHeight(false);
            document.getElementById('row_body').style.height = document.getElementById('caruselGifts').style.height = a + 'px';
		},

		balanceBonusHeader: function (balance) {
			console.log("WEBPassport.Views.Gifts_Item_Info:balancePromoHeader");

			if (this.ui.balance_header.length != 0) {
				this.ui.balance_header.text(balance)
			}
		},
	});


  WEBPassport.Views.Mobile_Balance_Info = WEBPassport.IViews.extend({
    el: "#page_get_mobile_balance",
    template: '#template_get_mobile_balance',
    ui: {
      top_tab_bar_gifts: "#top_tab_bar_gifts",
      back_btn: "#back_btn",

      get_mobile_balance_phone: "#get_mobile_balance_phone",
      get_mobile_balance_sum: "#get_mobile_balance_sum",
	  get_mobile_balance_operator: "#get_mobile_balance_operator",
      get_mobile_balance_send_btn: "#get_mobile_balance_send_btn",
    },
    events: {
      'click @ui.back_btn': 'returnBackToMainForm',
      'click @ui.get_mobile_balance_send_btn': 'onSendClick',
    },
    initializeAfter: function () {
      console.log("WEBPassport.Views.Mobile_Balance_Info:initializeAfter");
      this.listenTo(Backbone, "WEBPassport.Views.Mobile_Balance_Info:returnToMainForm", this.returnToMainForm);
      this.listenTo(Backbone, "WEBPassport.Views.BalanceBonuses:balanceBonusHeader", this.balanceBonusHeader);
      // _.bindAll(this, "onSuccessAfter");
    },
    onRender: function () {
      console.log("WEBPassport.Views.Mobile_Balance_Info:onRender");

	  document.getElementById('get_mobile_balance_phone').value = localStorage.phone;

      ons.compile(this.$el.get(0));
      this.$el.i18n();
      this.updateCSS();
    },

    // возврат на предыдующее окно
    returnBackToMainForm: function ()
    {
      this.returnToMainForm();
    },

    updateCSS: function () {
      console.log("WEBPassport.Views.Gifts.Mobile_Balance_Info:updateCSS");
      var a = window.innerHeight - this.ui.top_tab_bar_gifts.outerHeight(false) - $(this.el).find("ons-toolbar").outerHeight(false);
            document.getElementById('row_body').style.height = document.getElementById('caruselGifts').style.height = a + 'px';
    },

    balanceBonusHeader: function (balance) {
      console.log("WEBPassport.Views.Gifts.Mobile_Balance_Info:balancePromoHeader");

      if (this.ui.balance_header.length != 0) {
        this.ui.balance_header.text(balance)
      }
    },

    getModel: function () {
        console.log("WEBPassport.Views.TransferBonuses.BalanceMobile_Item:getModel");

		var op_code =
		{
			"Kcell" : "kcell",
			"Beeline (KZ)" : "beeline",
			"Tele2" : "tele2",
			"Altel 4G" : "Altel 4G",
			"Казахтелеком": "kazakhtelecom_phone",
			"Beeline (KG)": "beeline_kyrgyzstan",
			"Megacom": "megacom_kyrgyzstan",
			"O!": "o_kyrgyzstan"
		};

		var model = {
            phone: this.ui.get_mobile_balance_phone.val(),
            amount: parseFloat(this.ui.get_mobile_balance_sum.val()),
			operator: op_code[this.ui.get_mobile_balance_operator.val()]
        };

        return model;
    },

    onSendClick: function () {
        console.log("WEBPassport.Views.Gifts.Mobile_Balance_Info:onSendClick");
        var $this = this;
        var model = $this.getModel();

        if (!model.phone || !model.amount) {
            ShowAlert(i18n.t('wbs_p2p_monexy_error_msg'));
            return;
        }
		else
		if( !model.operator )
		{
			ShowAlert("Выберите оператора мобильной связи");
			return;
		}

        ShowLoader();

        // отправка запроса
        WEBPassport.requestModel.withdrawBonusesPhone(model.phone, model.amount, model.operator, $this.onSuccess);
    },
  });
});

//-----------------------------------------------------------------------------
//---------------------------- СТРАНИЦА "МОИ КОШЕЛЬКИ" ------------------------
//-----------------------------------------------------------------------------

ons.ready(function () {
    // MyWallets
    WEBPassport.Views.MyWalletsWidget = WEBPassport.Views.IWidget.extend({
        template: function (serialized_model) {
            return _.template($('#template_widget_MyWallets_2_2').html())(serialized_model);
        },
        ui: {
            content_widget: "#content_widget",
            balance_value: "#balance_value", // поле содержащие сумму кошелька
            resp_mark: "#resp_mark", // поле валюты
        },
        initializeAfter: function (options) {
            console.log("WEBPassport.Views.MyWalletsWidget:initializeAfter");
        },
        events: {
            "hold": "holdMenu",
            "click": "openScreen", // перейти к форме
        },
        clearAll: function () {
            console.log("WEBPassport.Views.MyWalletsWidget:clearAll");

            clearInterval(this.intervalUpdateInfo);
            this.stopListening();
            this.undelegateEvents();
            this.destroy();

        },
        onRenderAfter: function () {
            console.log("WEBPassport.Views.MyWalletsWidget:onRenderAfter");
            var $this = this;

            return true;
        },

        openScreen: function () {
            if (!isEditDashboard) {
                mobipayNavigatorOpen(

                       mobipayPage.myWallets,
                       "left",
                       {
                           backgroundColor: "#8f6b89",
                           activateTab: 1
                       }
                   );
            }
        },
    });
});

ons.ready(function () {
    //Вьюшка для страницы MyWallets
    WEBPassport.Views.MyWallets = WEBPassport.IViews.extend({
        el: "#page_my_wallets",
        template: '#template_my_wallets_content',
        ui: {
            top_tab_bar_my_wallets: "#top_tab_bar_my_wallets", //верхний таб бар
            row_body: "#row_body", // основной контент
            back_btn: "#back_btn", // кнопка назад
            my_wallets_header: "#my_wallets_header", // баланс промо хеадер

			my_wallets_balance_header: "#my_wallets_balance_header", // баланс промо хеадер

            tab_balance: "#tab_balance", // вкладка Кошелек
            tab_transfer_bonuses: "#tab_transfer_bonuses", // вкладка Перевести

            item_1: "#item_my_wallets_1", //карусель страница 1
            item_2: "#item_my_wallets_2", //карусель страница 2

            history: "#history_my_wallets",

            // headerMenu: "#headerMenu", // кнопка вызова меню (справа)
        },
        events: {
            'click @ui.back_btn': 'returnBeforeToMainForm', // нажатие кнопки назад

            'click @ui.tab_balance': 'goToTabBalance', // нажатие на вкладку Кошелек
            'click @ui.tab_transfer_bonuses': 'goToTabTransferBonuses', // нажатие на вкладку Перевести
        },

        // возврат на предыдующее окно
        returnBeforeToMainForm: function ()
		{
            var callback = function () {
                Backbone.trigger("WEBPassport.Views.MyWallets:clearAll");
            };

            this.returnToMainForm(callback);
        },

        initializeAfter: function () {
            console.log("WEBPassport.Views.MyWallets:initializeAfter");
            this.listenTo(Backbone, "WEBPassport.Views.MyWallets:returnToMainForm", this.returnBeforeToMainForm);
			this.listenTo(Backbone, "WEBPassport.Views.MyWallets:BalancePromoHeader", this.balancePromoHeader);

		//	WEBPassport.requestModel.getBalancePromo(this.onGetBalanceSuccess);
            //  рендерим вьишку бокового правого меню
            // Backbone.trigger('WEBPassport.Views.MainView:renderContextMenu', WEBPassport.Views.ProfileMenu);
        },
		/*
		onGetBalanceSuccess: function (model, response, options) {
            console.log("WEBPassport.Views.MyWallets:onGetBalanceSuccess");
			var data = response.data;
			var balance = data.balance;
			document.getElementById('my_wallets_balance_header').innerHTML = balance;
        },

        onGetBalanceError: function (model, response, options) {
            console.log("WEBPassport.Views.MyWallets:onGetBalanceError response.responseText = " + response.responseText);
        },
		*/

        onRender: function () {
            console.log("WEBPassport.Views.MyWallets:onRender");
            if (isMobile) window.analytics.trackEvent(localStorage.devType, 'win_monexy', 'Purse button', null);

            var $this = this;

            $this.isLock = true;
            setTimeout(function () {

                $this.Balance_Item = new Balance_Item({
                    model: WEBPassport.mainViewModel,
                    el: $this.ui.item_1
                }).render();

                $this.Transfer_Bonuses_Item = new Transfer_Bonuses_Item({
                    model: WEBPassport.mainViewModel,
                    el: $this.ui.item_2
                }).render();

                //caruselGifts.setActiveCarouselItemIndex($this.model.attributes.activateTab);
                $this.updateCSS();

                $this.isLock = false;
            }, window.settings.isEffects ? timeoutRender : 0);

            ons.compile(this.$el.get(0));
            this.$el.i18n();
            this.updateCSS();
        },

        // клик по меню (справа) открыть
        //openMenu: function () {
        //    console.log("WEBPassport.Views.Gifts:openMenu");
        //    Backbone.trigger("WEBPassport.Views.MainView:openMenu");
        //},

        //TODO: сделать листание свайпом карусели
        // ons-carousel swipeable
        // нажатие на вкладку Кошелек
        goToTabBalance: function () {
            console.log("WEBPassport.Views.MyWallets:goToTabBalance");
            caruselMyWallets.setActiveCarouselItemIndex(0);
        },

        // нажатие на вкладку Перевести
        goToTabTransferBonuses: function () {
            console.log("WEBPassport.Views.MyWallets:goToTabTransferBonuses");
            caruselMyWallets.setActiveCarouselItemIndex(1);
        },

        updateCSS: function () {
            console.log("WEBPassport.Views.MyWallets:updateCSS");
            var a = window.innerHeight - this.ui.top_tab_bar_my_wallets.outerHeight(false) - $(this.el).find("ons-toolbar").outerHeight(false);
            document.getElementById('caruselMyWallets').style.height = a + 'px';
			if(document.getElementById('history_my_wallets')) document.getElementById('history_my_wallets').style.height = a + 'px';
        },

    });

    // вкладка баланса
    var Balance_Item = Marionette.ItemView.extend({
        template: '#template_my_wallets_refill_item',
        className: "history-item",
        ui: {
          history_my_wallets: "#history_my_wallets", // лист истории
          emptyList: "#emptyList"
        },
        initialize: function (options) {
            console.log("WEBPassport.Views.MyWallets.Balance_Item:initialize");
            // для обновления истории
            this.listenTo(Backbone, "WEBPassport.Views.MyWallets.Balance_Item:updateHistory", this.updateHistory);
            this.listenTo(Backbone, 'WEBPassport.Views.MyWallets:clearAll', this.clearAll);

            _.bindAll(this, "onGetBalanceSuccess");

        },
        onRender: function () {
            console.log("WEBPassport.Views.MyWallets.Balance_Item:onRender");
            var $this = this;

			$this.updateHistory();

            ons.compile(this.$el.get(0));
            this.$el.i18n();
        },

        updateHistory: function () {
            console.log("WEBPassport.Views.MyWallets.Balance_Item:updateInfo");
            // отправка запроса
            WEBPassport.requestModel.getBalanceMyWallets(this.onGetBalanceSuccess, { type: 'updateHistory' });

        },
        onGetBalanceSuccess: function (model, response, options) {
            console.log("WEBPassport.Views.MyWallets.Balance_Item:onGetBalanceSuccess");
			if (options.obj.type == "updateHistory")
			{
				console.log("WEBPassport.Views.BalanceBonuses.Wallet_Item:onSuccessAfter response.json" + JSON.stringify(response.data));
				var list = response.data.balances;
				var resp = new Array();

				if( list && list.length > 0 )
				{
					this.ui.history_my_wallets.show();
					this.ui.emptyList.hide();

					list.forEach(function (a, i, lst)
					{
                        if(a.currency == "KZT")
					    {
					        lst[i].currency_full = "DreamPoints"
					        lst[i].end_date = "12 месяцев";
					        lst[i].shares_type = "Баланс";
					        lst[i].start_date = "срок действия:";
					        lst[i].title = "DreamClub";
					    }
                        else
					    if(a.currency == "RPO")
					    {
							lst[i].currency_full = "BrandPoints"
					        lst[i].end_date = "по 15.01.2017";
					        lst[i].shares_type = "Баланс акции";
					        lst[i].start_date = "с 01.01.2017";
					        lst[i].title = "Осень 2016";
					    }
					    else
					    if(a.currency == "PAP")
                        {
                            lst[i].currency_full = "Бонусы"
					        lst[i].end_date = "по 15.01.2017";
					        lst[i].shares_type = "Баланс выигрышей";
					        lst[i].start_date = "с 15.10.2016";
					        lst[i].title = "Осень 2016";
					    }
					    else
					    if(a.currency == "GRC")
                        {
                            lst[i].currency_full = "GracioPoints"
					        lst[i].end_date = "по 31.05.2017";
					        lst[i].shares_type = "Баланс акции";
					        lst[i].start_date = "с 01.12.2016";
					        lst[i].title = "Gracio";
					    }
					    else
					    if(a.currency == "PPS")
                        {
                            lst[i].currency_full = "PepsiPoints"
					        lst[i].end_date = "по 10.09.2017";
					        lst[i].shares_type = "Баланс акции";
					        lst[i].start_date = "с 01.06.2017";
					        lst[i].title = "PEPSI";
					    }
					});

					list.forEach(function (a, i, lst)
                    {
                        if(a.currency == "RLB" || a.currency == "HBK")
                        {
                    		lst.splice(i,1);
                    	}
                    });

					if (this.balance_MyWalletsHistoryCollectionView) {
						this.balance_MyWalletsHistoryCollectionView.destroyChildren();
						this.balance_MyWalletsHistoryCollectionView.collection = new Backbone.Collection(list);
						this.balance_MyWalletsHistoryCollectionView.render();
					}
					else {
						this.balance_MyWalletsHistoryCollectionView = new MyWalletsHistoryCollectionView({
							collection: new Backbone.Collection(list),
							el: this.ui.history_my_wallets
						}).render();
					}
				}
				else
				{
					this.ui.history_my_wallets.hide();
                    this.ui.emptyList.show();
				}
			}
        },
        onGetBalanceError: function (model, response, options) {
            console.log("WEBPassport.Views.MyWallets.Balance_Item:onGetBalanceError response.responseText = " + response.responseText);
        },

        clearAll: function () {
            console.log("WEBPassport.Views.MyWallets.Balance_Item:clearAll");

            this.stopListening();
            this.undelegateEvents();
            this.destroy();
        },
    });

    var MyWalletsHistoryCollectionView = Marionette.CollectionView.extend({
        childView: MyWalletsHistoryItemView,
		onRender: function () {
            console.log("WEBPassport.Views.MyWalletsHistoryCollectionView:onRender");
            ons.compile(this.$el.get(0));
            this.$el.i18n();
        },
        getChildView: function (item) {
            return MyWalletsHistoryItemView;
        },
    });

    var MyWalletsHistoryItemView = Marionette.ItemView.extend({
        tagName: "ons-list-item",
        className: "history-headere-item",
		template: '#template_my_wallets_item',
		data: null,
        ui: {
            title: "#my_wallets_balance_title",
            points: "#my_wallets_balance_points",
            date: "#my_wallets_balance_date",
			my_wallets_description_btn: "#my_wallets_description_btn",
			my_wallets_history_btn: "#my_wallets_history_btn",
        },
        events: {
			//'click' : 'showInfo',
			'click @ui.my_wallets_description_btn' : 'showDescription',
			'click @ui.my_wallets_history_btn' : 'showHistory',
        },
        initialize: function (options)
		{
			console.log("WEBPassport.Views.MyWalletsHistoryItemView:initializeDD");

            // для уничтожения полностью страницы кошелька
            this.listenTo(Backbone, 'WEBPassport.Views.MyWallets:clearAll', this.clearAll);
            //построить/привязать UI елементы
            this.bindUIElements();
        },
        onRender: function ()
		{
			console.log("WEBPassport.Views.MyWalletsHistoryItemView:onRender");
            this.$el.i18n();
        },

        clearAll: function () {
            console.log("WEBPassport.Views.MyWallets.BalanceHistoryItemView:clearAll");

            this.stopListening();
            this.undelegateEvents();
            this.destroy();
        },

		showDescription: function () {
            console.log("WEBPassport.Views.MyWallets.BalanceHistoryItemView:showDescription");
			var data = this.model.attributes;
			var id = data.action_id;
			WEBPassport.requestModel.getListActions(null, {action_id:id}, this.onSuccessAfter);
        },
        onSuccessAfter: function (model, response, options) {
			console.log("WEBPassport.Views.MyWallets.MyWalletsHistoryItemView:onSuccessAfter");
            response;

			var action_id = options.obj.action_id;

			var list = response.data.items;
			list.forEach(function (a, i) {
				if(a.id == action_id)
				{
					mobipayNavigatorOpen(mobipayPage.promotions_and_offers_dreamclub_item_info, "left", a); //
				}
			});

		},
		showHistory: function () {
            console.log("WEBPassport.Views.MyWallets.BalanceHistoryItemView:showHistory");
            mobipayNavigatorOpen(mobipayPage.my_wallets_item_info, "left", this.model.attributes);
        },
    });

	// мои подарки

    var Transfer_Bonuses_Item = Marionette.ItemView.extend({

      bonuses: {},
      temp:{},

      template: '#template_transfer_bonuses_item',
      ui: {
          my_wallets_transfer_from:					'#my_wallets_transfer_from',
          my_wallets_transfer_to:						'#my_wallets_transfer_to',
          my_wallets_transfer_money_sum:				'#my_wallets_transfer_money_sum',
          my_wallets_transfer_bonuses_label_sum: '#my_wallets_transfer_bonuses_label_sum',
          my_wallets_transfer_course_recognizer:		'#my_wallets_transfer_course_recognizer',
          my_wallets_transfer_btn:  					'#my_wallets_transfer_btn',
          my_wallets_transfer_bonuses_coefficient_value: '#my_wallets_transfer_bonuses_coefficient_value',
      },
      events: {
          'click @ui.my_wallets_transfer_btn':		'MyWalletsTransferButtonOnClick',
      },
      initialize: function (options) {
          console.log("WEBPassport.Views.MyWallets.Transfer_Bonuses_Item:initialize");
          this.listenTo(Backbone, 'WEBPassport.Views.Transfer_Bonuses_Item:clearAll', this.clearAll);

          this.bindUIElements();

          WEBPassport.requestModel.getBalanceMyWallets(this.onGetBalanceSuccess, {pointer : this});
      },

      onGetCurrencies: function (model, response, options)
      {
            console.log("WEBPassport.Views.MyWallets.Transfer_Bonuses_Item:OnGetCurrencies");
            console.log("response: " + JSON.stringify(response));

            var list = response.data.currencies;
            var transfer_from = "";
            var transfer_to = "";
            options.obj.currencies = [];

            list.forEach(function (a, i)
            {

                    if(a.supportedCurrencies.length == 0) return;

                    options.obj.currencies.push({full_name:a.full_name, short_name:a.short_name, supported_currencies:a.supportedCurrencies});

                    transfer_from += "<option>" + a.full_name + "</option>";

                    if( i == 0)
                    {
                    a.supportedCurrencies.forEach(function(b, j)
                    {
                        transfer_to += "<option>" + b.full_name + "</option>";

                    });
                    }
            });

            if( $(options.obj.pointer.ui.my_wallets_transfer_from).has('option').length == 0
             || $(options.obj.pointer.ui.my_wallets_transfer_to).has('option').length == 0 )
            {
              $(options.obj.pointer.ui.my_wallets_transfer_from).html(transfer_from);
              $(options.obj.pointer.ui.my_wallets_transfer_from).change(function()
              {
                  transfer_to = "";

                  var current_list = options.obj.currencies[this.selectedIndex].supported_currencies;
                  current_list.forEach(function(a, i)
                  {
                      transfer_to += "<option>" + a.full_name + "</option>";
                  });
                  $(options.obj.pointer.ui.my_wallets_transfer_to).html(transfer_to);

                  options.obj.pointer.updateFieldsAndLabels(options);
              });

              $(options.obj.pointer.ui.my_wallets_transfer_to).change(function()
              {
                  options.obj.pointer.updateFieldsAndLabels(options);
              });

              $(options.obj.pointer.ui.my_wallets_transfer_money_sum).on('input', function(e)
              {
                  options.obj.pointer.updateFieldsAndLabels(options);
              });

              $(options.obj.pointer.ui.my_wallets_transfer_to).html(transfer_to);
            }
            options.obj.pointer.updateFieldsAndLabels(options);

      },

      updateFieldsAndLabels: function (options)
      {
        console.log("WEBPassport.Views.MyWallets.Transfer_Bonuses_Item:updateFieldsAndLabels");

        var index_from = parseInt($(options.obj.pointer.ui.my_wallets_transfer_from).prop("selectedIndex"));
        var index_to = parseInt($(options.obj.pointer.ui.my_wallets_transfer_to).prop("selectedIndex"));
        var currency_list_from = options.obj.currencies;
        var currency_list_to = options.obj.currencies[index_from].supported_currencies;

        var currency_rate = parseFloat(parseFloat(currency_list_to[index_to].rate.split(':')[0]) / parseFloat(currency_list_to[index_to].rate.split(':')[1]));
        var expected_sum = ( !$(options.obj.pointer.ui.my_wallets_transfer_money_sum).val() ) ? parseFloat($(options.obj.pointer.ui.my_wallets_transfer_money_sum).attr("placeholder")) * currency_rate : parseFloat($(options.obj.pointer.ui.my_wallets_transfer_money_sum).val())  * currency_rate;
        console.log("index_from: " + JSON.stringify(index_from));
        console.log("list_from: " + JSON.stringify(currency_list_from));
        console.log("index_to: " + JSON.stringify(index_to));
        console.log("list_to: " + JSON.stringify(currency_list_to));
        console.log("currency_rate: " + JSON.stringify(currency_rate));
        console.log("expected_sum: " + JSON.stringify(expected_sum));
        console.log("bonuses: " + JSON.stringify(options.obj.pointer.bonuses));

        options.obj.pointer.temp.currency_from = currency_list_from[index_from].short_name;
        options.obj.pointer.temp.currency_to = currency_list_to[index_to].short_name;

        $(options.obj.pointer.ui.my_wallets_transfer_bonuses_label_sum).text("Доступно: " + options.obj.pointer.bonuses[currency_list_from[index_from].short_name].amount + " " + currency_list_from[index_from].full_name);
        $(options.obj.pointer.ui.my_wallets_transfer_course_recognizer).val(expected_sum.toFixed(2));
        $(options.obj.pointer.ui.my_wallets_transfer_bonuses_coefficient_value).text("1 " + currency_list_from[index_from].full_name + " = " + currency_rate.toFixed(2) + " " + currency_list_to[index_to].full_name);
     
     },

      onGetBalanceSuccess: function (model, response, options) {
              console.log("WEBPassport.Views.MyWallets.Transfer_Bonuses_Item:onGetBalanceSuccess");
              console.log("response: " + JSON.stringify(response));

              var points = { "KZT":"DreamPoints", "RPO":"BrandPoints", "PAP":"PAPPoints", "GRC":"GracioPoints" };
              var list = response.data.balances;

              list.forEach(function (a, i)
              {

                options.obj.pointer.bonuses[a.currency] = a;

                if(a.currency == "PAP")
                {
                  console.log("cur: " + a.amount);
                //	document.getElementById('my_wallets_transfer_bonuses_label_sum').innerHTML = "Доступно: " + a.amount + " " + points[a.currency];
                }
              });

              WEBPassport.requestModel.getCurrencies(options.obj.pointer.onGetCurrencies, {pointer : options.obj.pointer});
      },

      onGetBalanceError: function (model, response, options) {
              console.log("WEBPassport.Views.MyWallets.Transfer_Bonuses_Item:onGetBalanceError response.responseText = " + response.responseText);
      },

      onRender: function () {
              console.log("WEBPassport.Views.MyWallets.Transfer_Bonuses_Item:onRender");
              var $this = this;
              ons.compile(this.$el.get(0));
              this.$el.i18n();
      },

      clearAll: function () {
              console.log("WEBPassport.Views.MyWallets.Transfer_Bonuses_Item:clearAll");

              this.stopListening();
              this.undelegateEvents();
              this.destroy();
      },

      MyWalletsTransferButtonOnClick: function () {

        console.log("WEBPassport.Views.MyWallets.Transfer_Bonuses_Item:MyWalletsTransferButtonOnClick");

        var $this = this;

        var phone = parseInt(localStorage.phone);
        var sum = $this.ui.my_wallets_transfer_money_sum.val();
        var currency_from = $this.temp.currency_from;
        var currency_to = $this.temp.currency_to;

        console.log("WEBPassport.Views.MyWallets.Transfer_Bonuses_Item:MyWalletsTransferButtonOnClick | sum: " + sum + ", currency_from: " + currency_from + ", currency_to: " + currency_to);

        if (!sum)
        {
            ShowAlert(i18n.t('wbs_p2p_monexy_error_msg'));
            return;
        }

        ShowLoader();

        WEBPassport.requestModel.transferExchange(phone, sum, currency_from, currency_to, {pointer: $this}, $this.onMyWalletsTransferSuccess, $this.onMyWalletsTransferFailure);
      },

      onMyWalletsTransferSuccess: function (model, response, options) {

        console.log("WEBPassport.Views.MyWallets.Transfer_Bonuses_Item:onMyWalletsTransferSuccess");
        console.log("response: " + JSON.stringify(response));

        var $this = this;
        HideLoader();

        if (response.status == 201)
        {
          ShowAlert("Транзакция успешно завершена!");
        }

        WEBPassport.requestModel.getBalanceMyWallets(options.obj.pointer.onGetBalanceSuccess, {pointer : options.obj.pointer});
      },

      onMyWalletsTransferFailure: function (model, response, options) {

        console.log("WEBPassport.Views.MyWallets.Transfer_Bonuses_Item:onMyWalletsTransferFailure");
        console.log("error response: " + JSON.stringify(response));

        HideLoader();
        if (response.responseJSON && response.responseJSON.data[0] && response.responseJSON.data[0].message)
            ShowAlert(response.responseJSON.data[0].message);
      }

    });

	// #changes-start

	WEBPassport.Views.MyWallets_Item_Info = WEBPassport.IViews.extend({
        el: "#page_my_wallets_item_info",
        template: '#template_my_wallets_item_info_content',
        ui: {
			top_tab_bar_my_wallets: "#top_tab_bar_my_wallets",
			balance_bonus_my_wallets_item_info: "#balance_bonus_my_wallets_item_info",
			back_btn: "#back_btn",

			history_my_wallets_item_info: "#history_my_wallets_item_info",
			emptyList: "#emptyList"
        },
        events: {
			'click @ui.back_btn': 'returnBackToMainForm',
        },
        initializeAfter: function () {
			console.log("WEBPassport.Views.MyWallets_Item_Info:initializeAfter");
            this.listenTo(Backbone, "WEBPassport.Views.MyWallets_Item_Info:returnToMainForm", this.returnToMainForm);
			this.listenTo(Backbone, "WEBPassport.Views.MyWallets_Item_Info:updateHistory", this.updateHistory);
            this.listenTo(Backbone, 'WEBPassport.Views.MyWallets_Item_Info:clearAll', this.clearAll);

			_.bindAll(this, "onGetTransactionsHistorySuccess");

			// WEBPassport.requestModel.getBalancePromo(this.onGetBalanceSuccess);

			this.updateCSS();
        },

		onGetBalanceSuccess: function (model, response, options) {
            console.log("WEBPassport.Views.MyWallets_Item_Info:onGetBalanceSuccess");
			var data = response.data;
			var balance = data.balance;
			document.getElementById('balance_my_wallets_item_info_header').innerHTML = balance;
			document.getElementById('balance_my_wallets_item_info_value').innerHTML = balance;
        },

        onGetBalanceError: function (model, response, options) {
            console.log("WEBPassport.Views.MyWallets_Item_Info:onGetBalanceError response.responseText = " + response.responseText);
        },

        onRender: function () {
            console.log("WEBPassport.Views.MyWallets_Item_Info:onRender");
			var $this = this;
			$this.updateHistory();
            ons.compile(this.$el.get(0));
            this.$el.i18n();
			this.updateCSS();

			document.getElementById('balance_my_wallets_item_info_header').innerHTML = this.model.attributes.amount;
			document.getElementById('balance_my_wallets_item_info_value').innerHTML = this.model.attributes.amount;
        },
		balanceBonusHeader: function (balance) {
            console.log("WEBPassport.Views.MyWallets_Item_Info:balancePromoHeader");

            if (this.ui.balance_header.length != 0) {
                this.ui.balance_header.text(balance)
            }
        },
		returnBackToMainForm: function () {
            this.returnToMainForm();
        },

		updateCSS: function () {
            console.log("WEBPassport.Views.MyWallets_Item_Info:updateCSS");

			var a = window.innerHeight - this.ui.balance_bonus_my_wallets_item_info.outerHeight(false) - this.ui.top_tab_bar_my_wallets.outerHeight(false) - $(this.el).find("ons-toolbar").outerHeight(false);
            document.getElementById('row_body').style.height = a + 'px';
			if(document.getElementById('history_my_wallets_item_info')) document.getElementById('history_my_wallets_item_info').style.height = a + 'px';
        },

		updateHistory: function () {
            console.log("WEBPassport.Views.MyWallets.My_Wallets_Info_Inner_Item:updateInfo");
            // отправка запроса
            WEBPassport.requestModel.getTransactionsHistory(this.onGetTransactionsHistorySuccess, { type: 'updateHistory' }, this.model.attributes.currency);
        },

        onGetTransactionsHistorySuccess: function (model, response, options) {

			console.log("WEBPassport.Views.MyWallets.My_Wallets_Info_Inner_Item:onGetTransactionsHistorySuccess");

			if (options.obj.type == "updateHistory")
			{
				console.log("WEBPassport.Views.MyWallets.My_Wallets_Info_Inner_Item:onGetTransactionsHistorySuccess response.json" + JSON.stringify(response.data));

				var list = response.data.transactions;

				if( list && list.length > 0 )
				{
					this.ui.history_my_wallets_item_info.show();
					this.ui.emptyList.hide();

					list.forEach(function (a, i, lst)
					{
						console.log(a + " - " + i);

						if(a.payer.indexOf("KZT") != -1)
					    {
					        lst[i].payer = "DreamPoints";
					    }
                        else
						if(a.payer.indexOf("RPO") != -1)
					    {
							lst[i].payer = "BrandPoints";
					    }
					    else
						if(a.payer.indexOf("PAP") != -1)
                        {
                            lst[i].payer = "BrandPoints";
					    }
					    else
						if(a.payer.indexOf("GRC") != -1)
                        {
                            lst[i].payer = "GracioPoints";
					    }
                        //console.log(JSON.stringify(a));
					});

					var newList = new Array();
					var dateGroup;

					list.forEach(function (a, i) {
                        a.date = a.transaction_date + " " + a.transaction_time;
                        var date = moment(a.date, "YYYY-MM-DD HH:mm:ss").format("DD-MM-YYYY");
                        a.currency = response.data.currency;
                        if (!dateGroup) {
                            newList.push({ date: a.date, type: "header" })
                            dateGroup = date;
                        }

                        if (dateGroup != date) {
                            newList.push({ date: a.date, type: "header" })
                            dateGroup = date
                        }
                        newList.push(a);
                    });


					if (this.transactionsHistory_CollectionView) {
						this.transactionsHistory_CollectionView.destroyChildren();
						this.transactionsHistory_CollectionView.collection = new Backbone.Collection(newList);
						this.transactionsHistory_CollectionView.render();
					}
					else {
						this.transactionsHistory_CollectionView = new TransactionsHistoryCollectionView({
							collection: new Backbone.Collection(newList),
							el: this.ui.history_my_wallets_item_info
						}).render();
					}
				}
				else
				{
					this.ui.history_my_wallets_item_info.hide();
                    this.ui.emptyList.show();
				}

			}
			this.updateCSS();
        },

		onGetTransactionsHistoryError: function (model, response, options) {
            console.log("WEBPassport.Views.MyWallets.My_Wallets_Info_Inner_Item:onGetAllGiftsError response.responseText = " + response.responseText);
        },

		clearAll: function () {
            console.log("WEBPassport.Views.MyWallets.MyWallets_Item_Info:clearAll");

            this.stopListening();
            this.undelegateEvents();
            this.destroy();
        },
    });

	var TransactionsHistoryHeaderItemView = Marionette.ItemView.extend({
        tagName: "ons-list-header",
        template: '#template_header_list_item',
        onBeforeRender: function () {
            var date = this.model.attributes.date;
            if (moment().format("YYYY-MM-DD") == moment(date, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD'))
                this.model.attributes.date = (i18n.t('wbs_today_label')).toLowerCase();

            else if (moment().subtract(1, 'days').format("YYYY-MM-DD") == moment(date, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD'))
                this.model.attributes.date = (i18n.t('wbs_yesterday')).toLowerCase();

            else
                this.model.attributes.date = moment(date, 'YYYY-MM-DD HH:mm:ss').format("DD MMMM, YYYY").toLowerCase();
        }
    });

	var TransactionsHistoryCollectionView = Marionette.CollectionView.extend({
        childView: TransactionsHistoryHeaderItemView,
		onRender: function () {
            console.log("WEBPassport.Views.TransactionsHistoryCollectionView:onRender");
            ons.compile(this.$el.get(0));
            this.$el.i18n();

			$(".list__header").css('background-color', '#8f6b89');
        },
        childViewOptions: function(model, index) {
            return
            {
              childIndex: index
            }
        },
        getChildView: function (item) {
			if (item.attributes.type)
                return TransactionsHistoryHeaderItemView;
            else
                return TransactionsHistoryItemView;
        },
    });

    var TransactionsHistoryItemView = Marionette.ItemView.extend({
        tagName: "ons-list-item",
        className: "history-headere-item",
        events: {},
        template: '#template_my_wallets_item_info_inner_item',
        ui: {},
        initialize: function (options)
		{
			console.log("WEBPassport.MyWallets.Views.TransactionsHistoryItemView");
            // для уничтожения полностью страницы кошелька
            this.listenTo(Backbone, 'WEBPassport.Views.MyWallets_Item_Info:clearAll', this.clearAll);
            //построить/привязать UI елементы
            this.bindUIElements();
        },
        onRender: function ()
    	{
    		console.log("WEBPassport.Views.MyWallets.TransactionsHistoryItemView:onRender");
            this.$el.i18n();
        },
        clearAll: function ()
    		{
            console.log("WEBPassport.Views.MyWallets.TransactionsHistoryItemView:clearAll");

            this.stopListening();
            this.undelegateEvents();
            this.destroy();
        }
    });
});

// ENDCHANGES#RESMI

//-----------------------------------------------------------------------------
//---------------------------- СТРАНИЦА "BALANCE PROMO" -----------------------
//-----------------------------------------------------------------------------


ons.ready(function () {
    // Balance Promo
    WEBPassport.Views.ActivateBalancePromoWidget = WEBPassport.Views.IWidget.extend({
        template: function (serialized_model) {
            return _.template($('#template_widget_ActivateBalancePromo_2_2').html())(serialized_model);
        },
        ui: {
            content_widget: "#content_widget",
            balance_value: "#balance_value", // поле содержащие сумму кошелька
            resp_mark: "#resp_mark", // поле валюты
        },
        initializeAfter: function (options) {
            console.log("WEBPassport.Views.ActivateBalancePromoWidget:initializeAfter");
        },
        events: {
            "hold": "holdMenu",
            "click": "openScreen", // перейти к форме
        },
        clearAll: function () {
            console.log("WEBPassport.Views.ActivateBalancePromoWidget:clearAll");

            clearInterval(this.intervalUpdateInfo);
            this.stopListening();
            this.undelegateEvents();
            this.destroy();

        },
        onRenderAfter: function () {
            console.log("WEBPassport.Views.ActivateBalancePromoWidget:onRenderAfter");
            var $this = this;

            return true;
        },
        // перейти к форме  ( клик на вижет)
        openScreen: function () {
            // в режими редактирования ни куда не переходим

            if (!isEditDashboard) {
                mobipayNavigatorOpen(
                       mobipayPage.balance_promo,
                       "left",
                       {
                           backgroundColor: $(this.ui.content_widget).css("background-color"),
                           activateTab: 1
                       }
                   );
            }
        },
    });
});
ons.ready(function () {
    // Balance Bonuses
    WEBPassport.Views.BalanceBonusesWidget = WEBPassport.Views.IWidget.extend({
        template: function (serialized_model) {
            var size_y = serialized_model.type.size_y;
            var size_x = serialized_model.type.size_x;

            if (size_x == 2 && size_y == 2)
                return _.template($('#template_widget_loyalty_2_2').html())(serialized_model);
            if (size_x == 2 && size_y == 3 || size_x == 2 && size_y == 4)
                return _.template($('#template_widget_loyalty_tmpl_2').html())(serialized_model);
            else
                return _.template($('#template_widget_loyalty_tmpl_1').html())(serialized_model);
        },
        ui: {
            content_widget: "#content_widget",
            balance_value: "#balance_value", // поле содержащие сумму кошелька
            resp_mark: "#resp_mark", // поле валюты
        },
        initializeAfter: function (options) {
            console.log("WEBPassport.Views.BalanceBonusesWidget:initializeAfter");
            _.bindAll(this, 'onGetBalanceSuccess');
        },
        events: {
            "hold": "holdMenu",
            "click": "openScreen", // перейти к форме
        },
        clearAll: function () {
            console.log("WEBPassport.Views.BalanceBonusesWidget:clearAll");

            clearInterval(this.intervalUpdateInfo);
            this.stopListening();
            this.undelegateEvents();
            this.destroy();

        },
        onRenderAfter: function () {
            console.log("WEBPassport.Views.BalanceBonusesWidget:onRenderAfter");
            var $this = this;

            // удаляем интервал обновления кошелька
            if ($this.intervalUpdateInfo)
                clearInterval($this.intervalUpdateInfo);

            // получаем настройки
            var settings = getWSettings($this.model.attributes);

            var size_y = $this.model.attributes.type.size_y;
            var size_x = $this.model.attributes.type.size_x;

            // функционал для размера 2х3
            if (!(size_y == 2 && size_x == 2)) {
                // обновляем кошелек с заданным интервалом
                $this.intervalUpdateInfo = setInterval(function () {
                    $this.updateInfo();
                }, settings.updateInterval);

                $this.updateInfo();
            }
            else if ($this.model.attributes.type.size_y == 2)
            { }

            return true;
        },
        // обновляем кошелек
        updateInfo: function () {
            console.log("WEBPassport.Views.BalanceBonusesWidget:updateInfo");

            // если объект дом удален
            if (jQuery.type(this.ui.resp_mark) == "string") {
                clearInterval(this.intervalUpdateInfo);
                return;
            }

            // отправка запроса
            WEBPassport.requestModel.getBalanceBonuses(this.onGetBalanceSuccess);

        },
        onGetBalanceSuccess: function (model, response, options) {
            console.log("WEBPassport.Views.BalanceBonusesWidget:onGetBalanceSuccess");

            // TODO: currency
            this.ui.resp_mark.text(response.data.currency);
            this.ui.balance_value.text(response.data.balance);
            Backbone.trigger("WEBPassport.Views.BalanceBonuses:balanceBonusHeader", response.data.balance)
            //s  this.ui.balance_value.unmask().mask("# ##0.00", { reverse: true });
        },
        onGetBalanceError: function (model, response, options) {
            console.log("WEBPassport.Views.BalanceBonusesWidget:onGetBalanceError response.responseText = " + response.responseText);
        },

        // обновление данных виджета
        updateWidget: function () {
            console.log("WEBPassport.Views.BalanceBonusesWidget:updateWidget");
            this.updateInfo();
        },

        // настройки виджета
        settingsWidget: function () {
            console.log("WEBPassport.Views.BalanceBonusesWidget:settingsWidget");
            var $this = this;

            if (!$this.settingsDialog) {
                // создание окна настроек
                ons.createDialog('template_widget_wallet_settings').then(function (dialog) {
                    $this.settingsDialog = dialog;

                    $this.walletWidgetSetting = new WEBPassport.Views.WalletWidgetSetting({
                        el: $this.settingsDialog._element[0],
                        dialog: $this.settingsDialog,
                        settings: getWSettings($this.model.attributes),
                        widgetId: $this.model.attributes.id
                    });


                    $this.settingsDialog.show();
                    $this.walletWidgetSetting.$el.i18n();
                });
            }
            else
                $this.settingsDialog.show();
        },

        // перейти к форме  ( клик на вижет)
        openScreen: function () {
            // в режими редактирования ни куда не переходим

            if (!isEditDashboard) {
                mobipayNavigatorOpen(
                       mobipayPage.balance_bonuses,
                       "left",
                       {
                           backgroundColor: $(this.ui.content_widget).css("background-color")
                       }
                   );
            }
        },
    });
});
ons.ready(function () {
    //Вьюшка для страницы balance_bonuses
    WEBPassport.Views.BalanceBonuses = WEBPassport.IViews.extend({
        el: "#page_balance_bonuses",
        template: '#template_balance_bonuses_content',
        ui: {
            top_tab_bar_balance_bonuses: "#top_tab_bar_balance_bonuses", //верхний таб бар
            row_body: "#row_body", // основной контент
            back_btn: "#back_btn", // кнопка назад
            info_btn: "#info_btn", //кнопка вызова справки
            balance_header: "#balance_header",//  баланс хеадер

            tab_balance_bonuses: "#tab_balance_bonuses", // вкладка Кошелек
            tab_transfer: "#tab_transfer", // вкладка Перевести

            item_1: "#item_1", //карусель страница 1
            item_2: "#item_2", //карусель страница 2

            // headerMenu: "#headerMenu", // кнопка вызова меню (справа)
        },
        events: {
            'click @ui.back_btn': 'returnBeforeToMainForm', // нажатие кнопки назад

            'click @ui.tab_balance_bonuses': 'goToTabWallet', // нажатие на вкладку Кошелек
            'click @ui.tab_transfer': 'goToTabTransfer', // нажатие на вкладку Перевести
            'click @ui.info_btn': 'openHalp', // нажатие кнопки справа
        },

        // клик по кнопка помощь
        openHalp: function () {
            console.log("WEBPassport.Views.BalanceBonuses:openHalp");

            mobipayNavigatorOpen(mobipayPage.halp, "lift", {
                info_text: i18n.t('wbs_info_balancebonuses_dream'),
                backgroundColor: this.model.attributes.backgroundColor
            });
        },

        // возврат на предыдующее окно
        returnBeforeToMainForm: function () {

            if (this.Transfer_Item && this.Transfer_Item.selectOptionsDialog.dialog.isShown()) {
                this.Transfer_Item.selectOptionsDialog.dialog.hide();
                return;
            }
            var callback = function () {
                Backbone.trigger("WEBPassport.Views.BalanceBonuses:clearAll");
            };

            this.returnToMainForm(callback);
        },

        initializeAfter: function () {
            console.log("WEBPassport.Views.BalanceBonuses:initializeAfter");
            this.listenTo(Backbone, "WEBPassport.Views.BalanceBonuses:returnToMainForm", this.returnBeforeToMainForm);
            this.listenTo(Backbone, "WEBPassport.Views.BalanceBonuses:balanceBonusHeader", this.balanceBonusHeader);
            //  рендерим вьюшку бокового правого меню
            // Backbone.trigger('WEBPassport.Views.MainView:renderContextMenu', WEBPassport.Views.ProfileMenu);
        },
        onRender: function () {
            console.log("WEBPassport.Views.BalanceBonuses:onRender");
            if (isMobile) window.analytics.trackEvent(localStorage.devType, 'win_monexy', 'Purse button', null);

            var $this = this;

            $this.isLock = true;
            setTimeout(function () {

                $this.Wallet_Item = new Wallet_Item({
                    model: WEBPassport.mainViewModel,
                    el: $this.ui.item_1
                }).render();

                $this.isLock = false;
            }, window.settings.isEffects ? timeoutRender : 0);

            ons.compile(this.$el.get(0));
            this.$el.i18n();
            this.updateCSS();
        },

        // клик по меню (справа) открыть
        //openMenu: function () {
        //    console.log("WEBPassport.Views.BalanceBonuses:openMenu");
        //    Backbone.trigger("WEBPassport.Views.MainView:openMenu");
        //},

        //TODO: сделать листание свайпом карусели
        // ons-carousel swipeable
        // нажатие на вкладку Кошелек
        goToTabWallet: function () {
            console.log("WEBPassport.Views.BalanceBonuses:goToTabWallet");
            caruselBalanceBonuses.setActiveCarouselItemIndex(0);
            // if (isMobile) window.analytics.trackEvent(localStorage.devType, 'win_monexy', 'MoneXy Purse', null);
        },

        // нажатие на вкладку Перевести
        goToTabTransfer: function () {
            console.log("WEBPassport.Views.BalanceBonuses:goToTabTransfer");
            caruselBalanceBonuses.setActiveCarouselItemIndex(1);
            //  if (isMobile) window.analytics.trackEvent(localStorage.devType, 'win_monexy', 'MoneXy Tab Translate', null);
        },

        updateCSS: function () {
            console.log("WEBPassport.Views.BalanceBonuses:updateCSS");
            var a = window.innerHeight - $(this.el).find("ons-toolbar").outerHeight(true);
            this.ui.row_body.css("height", a + "px");
        },

        balanceBonusHeader: function (balance) {
            console.log("WEBPassport.Views.BalancePromo:balancePromoHeader");
            window.balance_bonus_header = balance;

            if (this.ui.balance_header.length != 0) {
                this.ui.balance_header.text(balance)
            }
        },
    });

    // виьшка вкладки КОШЕЛЕК
    var Wallet_Item = Marionette.ItemView.extend({
        template: '#template_balance_bonuses_refill_item',
        className: "history-item",
        ui: {
            resp_mark: "#resp_mark", // валюта
            balance_value: "#balance_value", // баланс
            history_balance_bonuses: "#history_balance_bonuses", // лист истории
            emptyList: "#emptyList"
        },
        initialize: function () {
            console.log("WEBPassport.Views.BalanceBonuses.Wallet_Item:initialize");

            // для обновления кошелька
            this.listenTo(Backbone, "WEBPassport.Views.BalanceBonuses.Wallet_Item:updateWallet", this.updateWallet);

            // для обновления истории
            this.listenTo(Backbone, "WEBPassport.Views.BalanceBonuses.Wallet_Item:updateHistory", this.updateHistory);

            // для уничтожения полностью страницы кошелька
            this.listenTo(Backbone, 'WEBPassport.Views.BalanceBonuses:clearAll', this.clearAll);

            _.bindAll(this, "onSuccessAfter");
        },
        onRender: function () {
            console.log("WEBPassport.Views.BalanceBonuses.Wallet_Item:onRender");
            var $this = this;

            $this.updateWallet();
            $this.updateHistory();

            ons.compile(this.$el.get(0));
            this.$el.i18n();
        },

        // обновить баланс
        updateWallet: function () {
            console.log("WEBPassport.Views.BalanceBonuses.Wallet_Item:updateWallet");
            ShowLoader();
            // отправка запроса
            WEBPassport.requestModel.getBalanceBonuses(this.onSuccessAfter, { type: 'updateWallet' });
        },

        // обновить историю
        updateHistory: function () {
            var dateFrom = "";
            var dateTo = "";
            var payment = 1;//2;
            var page = 0;
            var rows = 20;
            var currency = "KZT";//this.model.attributes.mobile.toString().substr(0, 3) == "380" ? "UAH" : "EUR";

            // отправка запроса
            WEBPassport.requestModel.getTransactionsHistory(this.onSuccessAfter, { type: 'updateHistory' }, currency);
        },

        onSuccessAfter: function (model, response, options) {
            console.log("WEBPassport.Views.BalanceBonuses.Wallet_Item:onSuccessAfter");
            console.log("WEBPassport.Views.BalanceBonuses.Wallet_Item:onSuccessAfter response.json" + JSON.stringify(response.data));
            console.log("WEBPassport.Views.BalanceBonuses.Wallet_Item:onSuccessAfter type = " + options.obj.type);
            HideLoader();
            // если объект дом удален
            if (jQuery.type(this.ui.resp_mark) == "string") return;

            if (options.obj.type == "updateWallet") {
                this.ui.resp_mark.text(response.data.currency);
                this.ui.balance_value.text(response.data.balance);
                Backbone.trigger("WEBPassport.Views.BalanceBonuses:balanceBonusHeader", response.data.balance)
                //  this.ui.balance_value.unmask().mask("# ##0.00", { reverse: true });
            }
            else if (options.obj.type == "updateHistory") {
                console.log("WEBPassport.Views.BalanceBonuses.Wallet_Item:onSuccessAfter.updateHistory operations = ");

                var list = response.data.transactions;
                var newList = new Array();
                var dateGroup;

                if (list && list.length > 0) {
                    this.ui.history_balance_bonuses.show();
                    this.ui.emptyList.hide();

                    list.forEach(function (a, i) {
                        a.date = a.transaction_date + " " + a.transaction_time;
                        var date = moment(a.date, "YYYY-MM-DD HH:mm:ss").format("DD-MM-YYYY");
                        a.currency = response.data.currency;
                        if (!dateGroup) {
                            newList.push({ date: a.date, type: "header" })
                            dateGroup = date;
                        }

                        if (dateGroup != date) {
                            newList.push({ date: a.date, type: "header" })
                            dateGroup = date
                        }
                        newList.push(a);
                    });

                    // рендерим страницы карусели и виджеты на ней
                    if (this.balance_bonusesHistoryCollectionView) {
                        this.balance_bonusesHistoryCollectionView.destroyChildren();
                        this.balance_bonusesHistoryCollectionView.collection = new Backbone.Collection(newList);
                        this.balance_bonusesHistoryCollectionView.render();
                    }
                    else {
                        this.balance_bonusesHistoryCollectionView = new WalletHistoryCollectionView({
                            collection: new Backbone.Collection(newList),
                            el: this.ui.history_balance_bonuses
                        }).render();
                    }
                }
                else {
                    this.ui.history_balance_bonuses.hide();
                    this.ui.emptyList.show();
                }
            }
        },
        clearAll: function () {
            console.log("WEBPassport.Views.BalanceBonuses.Transfer_Item:clearAll");

            this.stopListening();
            this.undelegateEvents();
            this.destroy();
        },
    });

    // вьшка для строки в списке
    var WalletHistoryItemView = Marionette.ItemView.extend({
        tagName: "ons-list-item",
        className: "history-headere-item",
        events: {
            //'click': 'toogleInfo', // клик по строке
        },
        template: '#template_balance_bonuses_history_item',
        ui: {
            amount: "#amount", // строка суммы
            amount_value: "#amount_value", // сумма
            user_to: "#user_to",

            inf_user_to: "#inf_user_to",
            inf_amount_value: "#inf_amount_value",
            inf_balance_value: "#inf_balance_value",

            row_history_info: "#row_history_info",
            arrow_down: "#arrow_down",
            user_to_tittle: "#user_to_tittle",
        },
        initialize: function (options) {
            // для уничтожения полностью страницы кошелька
            this.listenTo(Backbone, 'WEBPassport.Views.BalanceBonuses:clearAll', this.clearAll);

            //построить/привязать UI елементы
            this.bindUIElements();
        },
        onRender: function () {
            this.ui.user_to.unmask();
            //if (parseInt(this.model.attributes.recipient) > 0) {
            //    var result = listMaskPhone.getMaskForPhoneNumber(this.model.attributes.recipient);
            //    if (result.mask) {
            //        this.ui.user_to.val(parseInt(this.model.attributes.recipient));
            //        this.ui.user_to.unmask().mask(result.mask, { 'translation': { x: { pattern: /[0-9]/ } } });

            //    }
            //}


            //this.ui.amount_value.unmask().mask("# ##0.00", { reverse: true });
            this.$el.i18n();
        },

        // клик по строке
        toogleInfo: function () {
            console.log("WEBPassport.Views.BalanceBonuses.WalletHistoryItemView:toogleInfo");
            if (isMobile) window.analytics.trackEvent(localStorage.devType, 'win_monexy', 'MoneXy translation properties', null);
            this.ui.row_history_info.toggle();

            if (this.ui.arrow_down.hasClass('rotate-90'))
                this.ui.arrow_down.removeClass('rotate-90').addClass('rotate-270');
            else
                this.ui.arrow_down.removeClass('rotate-270').addClass('rotate-90');
        },
        clearAll: function () {
            console.log("WEBPassport.Views.BalanceBonuses.WalletHistoryItemView:clearAll");

            this.stopListening();
            this.undelegateEvents();
            this.destroy();
        },
    });

    // вьшка для заголовка с датой в списке
    var WalletHistoryHeaderItemView = Marionette.ItemView.extend({
        tagName: "ons-list-header",
        template: '#template_header_list_item',
        onBeforeRender: function () {
            var date = this.model.attributes.date;
            if (moment().format("YYYY-MM-DD") == moment(date, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD'))
                this.model.attributes.date = (i18n.t('wbs_today_label')).toLowerCase();

            else if (moment().subtract(1, 'days').format("YYYY-MM-DD") == moment(date, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD'))
                this.model.attributes.date = (i18n.t('wbs_yesterday')).toLowerCase();

            else
                this.model.attributes.date = moment(date, 'YYYY-MM-DD HH:mm:ss').format("DD MMMM, YYYY").toLowerCase();
        }
    });

    // коллекция для истории
    var WalletHistoryCollectionView = Marionette.CollectionView.extend({
        childView: WalletHistoryHeaderItemView,
        onRender: function () {
            console.log("WEBPassport.Views.WalletHistoryCollectionView:onRender");
            // ons.compile(this.$el.get(0));
            ons.compile(this.$el.get(0));
            this.$el.i18n();
        },
        getChildView: function (item) {
            if (item.attributes.type)
                return WalletHistoryHeaderItemView;
            else
                return WalletHistoryItemView;
        },
    });

});
ons.ready(function () {
    // Пейджер
    WEBPassport.Views.TransferBonusesWidget = WEBPassport.Views.IWidget.extend({
        template: function (serialized_model) {
            return _.template($('#template_widget_transfer_bonuses_2_2').html())(serialized_model);
        },
        ui: {
            content_widget: "#content_widget",
        },
        initializeAfter: function (options) {
            console.log("WEBPassport.Views.TransferBonusesWidget:initializeAfter");
        },
        events: {
            "hold": "holdMenu",
            "click": "openScreen", // перейти к форме
        },
        onRenderAfter: function () {
            console.log("WEBPassport.Views.TransferBonusesWidget:onRenderAfter");

            return true;
        },
        // перейти к форме  ( клик на вижет)
        openScreen: function (e) {
            console.log("WEBPassport.Views.TransferBonusesWidget:openScreen");
            // в режими редактирования ни куда не переходим
            if (!isEditDashboard) {
                mobipayNavigatorOpen(
                 mobipayPage.transfer_bonuses,
                 "left",
                 { backgroundColor: "#a07f9b" }
             );
            }
        }
    });
});
ons.ready(function () {
    //Вьюшка для страницы TransferBonuses
    WEBPassport.Views.TransferBonuses = WEBPassport.IViews.extend({
        el: "#page_transfer_bonuses",
        template: '#template_transfer_bonuses_content',
        ui: {
            top_tab_bar: "#top_tab_bar", //верхний таб бар
            row_body: "#row_body", // основной контент
            back_btn: "#back_btn", // кнопка назад
            info_btn: "#info_btn", //кнопка вызова справки

            tab_salempay: "#tab_salempay", // вкладка
            tab_balance_mobile: "#tab_balance_mobile", // вкладка

            item_1: "#item_1", //карусель страница 1
            item_2: "#item_2", //карусель страница 2

            balance_header: "#balance_header",//  баланс хеадер

            // headerMenu: "#headerMenu", // кнопка вызова меню (справа)
        },
        events: {
            'click @ui.back_btn': 'returnBeforeToMainForm', // нажатие кнопки назад

            'click @ui.tab_salempay': 'goToTabSalemPay', // нажатие на вкладку Кошелек
            'click @ui.tab_balance_mobile': 'goToTabBalanceMobile', // нажатие на вкладку Перевести
            'click @ui.info_btn': 'openHalp', // нажатие кнопки справа
            'click @ui.balance_header': 'goBalanceBonuses',
        },

        // клик по кнопка помощь
        openHalp: function () {
            console.log("WEBPassport.Views.TransferBonuses:openHalp");

            mobipayNavigatorOpen(mobipayPage.halp, "lift", {
                info_text: i18n.t('wbs_info_balancebonuses_dream'),
                backgroundColor: this.model.attributes.backgroundColor
            });
        },

        // возврат на предыдующее окно
        returnBeforeToMainForm: function () {
            var callback = function () {
                Backbone.trigger("WEBPassport.Views.TransferBonuses:clearAll");
            };

            this.returnToMainForm(callback);
        },

        initializeAfter: function () {
            console.log("WEBPassport.Views.TransferBonuses:initializeAfter");
            this.listenTo(Backbone, "WEBPassport.Views.TransferBonuses:returnToMainForm", this.returnBeforeToMainForm);
            this.listenTo(Backbone, "WEBPassport.Views.BalanceBonuses:balanceBonusHeader", this.balanceBonusHeader);
        },
        onRender: function () {
            console.log("WEBPassport.Views.TransferBonuses:onRender");
            if (isMobile) window.analytics.trackEvent(localStorage.devType, 'win_monexy', 'Purse button', null);

            var $this = this;

            $this.isLock = true;
            setTimeout(function () {

                $this.SalemPay_Item = new SalemPay_Item({
                    model: new Backbone.Model(),
                    el: $this.ui.item_1
                }).render();

                $this.BalanceMobile_Item = new BalanceMobile_Item({
                    model: new Backbone.Model(),
                    el: $this.ui.item_2
                }).render();


                //caruselTransferBonuses.setActiveCarouselItemIndex($this.model.attributes.activateTab);
                if ($this.model.attributes.activateTab == 1)
                    $this.ui.tab_transfer.click();

                $this.isLock = false;
            }, window.settings.isEffects ? timeoutRender : 0);

            ons.compile(this.$el.get(0));
            this.$el.i18n();
            this.updateCSS();
        },

        //TODO: сделать листание свайпом карусели
        // ons-carousel swipeable
        // нажатие на вкладку
        goToTabSalemPay: function () {
            console.log("WEBPassport.Views.TransferBonuses:goToTabSalemPay");
            caruselTransferBonuses.setActiveCarouselItemIndex(0);
            // if (isMobile) window.analytics.trackEvent(localStorage.devType, 'win_monexy', 'MoneXy Purse', null);
        },

        // нажатие на вкладку
        goToTabBalanceMobile: function () {
            console.log("WEBPassport.Views.TransferBonuses:goToTabBalanceMobile");
            caruselTransferBonuses.setActiveCarouselItemIndex(1);
            //  if (isMobile) window.analytics.trackEvent(localStorage.devType, 'win_monexy', 'MoneXy Tab Translate', null);
        },

        updateCSS: function () {
            console.log("WEBPassport.Views.TransferBonuses:updateCSS");
            var a = window.innerHeight - this.ui.top_tab_bar.outerHeight(true) - $(this.el).find("ons-toolbar").outerHeight(true);
            this.ui.row_body.css("height", a + "px");
        },

        balanceBonusHeader: function (balance) {
            console.log("WEBPassport.Views.TransferBonuses:balancePromoHeader");

            if (jQuery.type(this.ui.balance_header) == "string" || !this.ui.balance_header) return;
            if (this.ui.balance_header.length != 0) {
                this.ui.balance_header.text(balance)
            }
        },
        goBalanceBonuses: function () {
            console.log("WEBPassport.Views.TransferBonuses:goBalanceBonuses");
            mobipayNavigatorOpen(mobipayPage.balance_bonuses, "left");
        },
    });

    var SalemPay_Item = Marionette.ItemView.extend({

      bonuses: {},
      temp:{},

      template: '#template_transfer_bonuses_item',
      ui: {
          my_wallets_transfer_from:					'#my_wallets_transfer_from',
          my_wallets_transfer_to:						'#my_wallets_transfer_to',
          my_wallets_transfer_money_sum:				'#my_wallets_transfer_money_sum',
          my_wallets_transfer_bonuses_label_sum: '#my_wallets_transfer_bonuses_label_sum',
          my_wallets_transfer_course_recognizer:		'#my_wallets_transfer_course_recognizer',
          my_wallets_transfer_btn:  					'#my_wallets_transfer_btn',
          my_wallets_transfer_bonuses_coefficient_value: '#my_wallets_transfer_bonuses_coefficient_value',
      },
      events: {
          'click @ui.my_wallets_transfer_btn':		'MyWalletsTransferButtonOnClick',
      },
      initialize: function (options) {
          console.log("WEBPassport.Views.MyWallets.SalemPay_Item:initialize");
          this.listenTo(Backbone, 'WEBPassport.Views.SalemPay_Item:clearAll', this.clearAll);

          this.bindUIElements();

          WEBPassport.requestModel.getBalanceMyWallets(this.onGetBalanceSuccess, {pointer : this});
          //WEBPassport.requestModel.getCurrencies(this.onGetCurrencies, {pointer : this});

      },

      onGetCurrencies: function (model, response, options)
      {
            console.log("WEBPassport.Views.MyWallets.SalemPay_Item:OnGetCurrencies");
            console.log("response: " + JSON.stringify(response));

            var list = response.data.currencies;
            var transfer_from = "";
            var transfer_to = "";
            options.obj.currencies = [];

            list.forEach(function (a, i)
            {

                if(a.supportedCurrencies.length == 0) return;

                options.obj.currencies.push({full_name:a.full_name, short_name:a.short_name, supported_currencies:a.supportedCurrencies});

                transfer_from += "<option>" + a.full_name + "</option>";

                if( i == 0)
                {
                  a.supportedCurrencies.forEach(function(b, j)
                  {
                      transfer_to += "<option>" + b.full_name + "</option>";

                  });
                }
            });

            if( $(options.obj.pointer.ui.my_wallets_transfer_from).has('option').length == 0
             || $(options.obj.pointer.ui.my_wallets_transfer_to).has('option').length == 0 )
            {
              $(options.obj.pointer.ui.my_wallets_transfer_from).html(transfer_from);
              $(options.obj.pointer.ui.my_wallets_transfer_from).change(function()
              {
                  transfer_to = "";

                  var current_list = options.obj.currencies[this.selectedIndex].supported_currencies;
                  current_list.forEach(function(a, i)
                  {
                      transfer_to += "<option>" + a.full_name + "</option>";
                  });
                  $(options.obj.pointer.ui.my_wallets_transfer_to).html(transfer_to);

                  options.obj.pointer.updateFieldsAndLabels(options);
              });

              $(options.obj.pointer.ui.my_wallets_transfer_to).change(function()
              {
                  options.obj.pointer.updateFieldsAndLabels(options);
              });

              $(options.obj.pointer.ui.my_wallets_transfer_money_sum).on('input', function(e)
              {
                  options.obj.pointer.updateFieldsAndLabels(options);
              });

              $(options.obj.pointer.ui.my_wallets_transfer_to).html(transfer_to);
            }
            options.obj.pointer.updateFieldsAndLabels(options);

      },

      updateFieldsAndLabels: function (options)
      {
        console.log("WEBPassport.Views.MyWallets.SalemPay_Item:updateFieldsAndLabels");

        var index_from = parseInt($(options.obj.pointer.ui.my_wallets_transfer_from).prop("selectedIndex"));
        var index_to = parseInt($(options.obj.pointer.ui.my_wallets_transfer_to).prop("selectedIndex"));
        var currency_list_from = options.obj.currencies;
        var currency_list_to = options.obj.currencies[index_from].supported_currencies;
        var currency_rate = parseFloat(parseFloat(currency_list_to[index_to].rate.split(':')[0]) / parseFloat(currency_list_to[index_to].rate.split(':')[1]));
        var expected_sum = ( !$(options.obj.pointer.ui.my_wallets_transfer_money_sum).val() ) ? parseFloat($(options.obj.pointer.ui.my_wallets_transfer_money_sum).attr("placeholder")) * currency_rate : parseFloat($(options.obj.pointer.ui.my_wallets_transfer_money_sum).val())  * currency_rate;

        console.log("index_from: " + JSON.stringify(index_from));
        console.log("list_from: " + JSON.stringify(currency_list_from));
        console.log("index_to: " + JSON.stringify(index_to));
        console.log("list_to: " + JSON.stringify(currency_list_to));
        console.log("currency_rate: " + JSON.stringify(currency_rate));
        console.log("expected_sum: " + JSON.stringify(expected_sum));
        console.log("bonuses: " + JSON.stringify(options.obj.pointer.bonuses));

        options.obj.pointer.temp.currency_from = currency_list_from[index_from].short_name;
        options.obj.pointer.temp.currency_to = currency_list_to[index_to].short_name;

        $(options.obj.pointer.ui.my_wallets_transfer_bonuses_label_sum).text("Доступно: " + options.obj.pointer.bonuses[currency_list_from[index_from].short_name].amount + " " + currency_list_from[index_from].full_name);
        $(options.obj.pointer.ui.my_wallets_transfer_course_recognizer).val(expected_sum.toFixed(2));
        $(options.obj.pointer.ui.my_wallets_transfer_bonuses_coefficient_value).text("1 " + currency_list_from[index_from].full_name + " = " + currency_rate.toFixed(2) + " " + currency_list_to[index_to].full_name);
      },

      onGetBalanceSuccess: function (model, response, options) {
              console.log("WEBPassport.Views.MyWallets.SalemPay_Item:onGetBalanceSuccess");
              console.log("response: " + JSON.stringify(response));

              var points = { "KZT":"DreamPoints", "RPO":"BrandPoints", "PAP":"PAPPoints", "GRC":"GracioPoints" };
              var list = response.data.balances;

              list.forEach(function (a, i)
              {

                options.obj.pointer.bonuses[a.currency] = a;

                if(a.currency == "PAP")
                {
                  console.log("cur: " + a.amount);
                //	document.getElementById('my_wallets_transfer_bonuses_label_sum').innerHTML = "Доступно: " + a.amount + " " + points[a.currency];
                }
              });

              WEBPassport.requestModel.getCurrencies(options.obj.pointer.onGetCurrencies, {pointer : options.obj.pointer});
      },

      onGetBalanceError: function (model, response, options) {
              console.log("WEBPassport.Views.MyWallets.SalemPay_Item:onGetBalanceError response.responseText = " + response.responseText);
      },

      onRender: function () {
              console.log("WEBPassport.Views.MyWallets.SalemPay_Item:onRender");
              var $this = this;
              ons.compile(this.$el.get(0));
              this.$el.i18n();
      },

      clearAll: function () {
              console.log("WEBPassport.Views.MyWallets.SalemPay_Item:clearAll");

              this.stopListening();
              this.undelegateEvents();
              this.destroy();
      },

      MyWalletsTransferButtonOnClick: function () {

        console.log("WEBPassport.Views.MyWallets.SalemPay_Item:MyWalletsTransferButtonOnClick");

        var $this = this;

        var phone = parseInt(localStorage.phone);
        var sum = $this.ui.my_wallets_transfer_money_sum.val();
        var currency_from = $this.temp.currency_from;
        var currency_to = $this.temp.currency_to;

        console.log("WEBPassport.Views.MyWallets.SalemPay_Item:MyWalletsTransferButtonOnClick | sum: " + sum + ", currency_from: " + currency_from + ", currency_to: " + currency_to);

        if (!sum)
        {
            ShowAlert(i18n.t('wbs_p2p_monexy_error_msg'));
            return;
        }

        ShowLoader();

        WEBPassport.requestModel.transferExchange(phone, sum, currency_from, currency_to, {pointer: $this}, $this.onMyWalletsTransferSuccess, $this.onMyWalletsTransferFailure);
      },

      onMyWalletsTransferSuccess: function (model, response, options) {

        console.log("WEBPassport.Views.MyWallets.SalemPay_Item:onMyWalletsTransferSuccess");
        console.log("response: " + JSON.stringify(response));

        var $this = this;
        HideLoader();

        if (response.status == 201)
        {
          ShowAlert("Транзакция успешно завершена!");
        }

        WEBPassport.requestModel.getBalanceMyWallets(options.obj.pointer.onGetBalanceSuccess, {pointer : options.obj.pointer});
      },

      onMyWalletsTransferFailure: function (model, response, options) {

        console.log("WEBPassport.Views.MyWallets.SalemPay_Item:onMyWalletsTransferFailure");
        console.log("error response: " + JSON.stringify(response));

        HideLoader();
        if (response.responseJSON && response.responseJSON.data[0] && response.responseJSON.data[0].message)
            ShowAlert(response.responseJSON.data[0].message);
      }

    });



    /*
    // виьшка вкладки КОШЕЛЕК
    var SalemPay_Item = Marionette.ItemView.extend({


        template: '#template_salempay_item',
        className: "history-item",
        ui: {
            phone_input: "#phone_input",
            sum_input: "#sum_input",
            send_btn: "#send_btn",
            address_book_btn: "#address-book-btn", // кнопка телефонной книги
            select_phone_mask: "#select_phone_mask", // кнопка выбора маски
            iso: "#iso", // iso страны
        },
        events: {
            'click @ui.send_btn': "onSendClick", // нажатие на кнопку оплатить
            'click @ui.address_book_btn': 'showAdressBook', // открыть телефонный справочник
            'click @ui.select_phone_mask': 'selectPhoneMask', // клик на кнопку выбора маски
        },
        initialize: function () {
            console.log("WEBPassport.Views.TransferBonuses.SalemPay_Item:initialize");

            // для уничтожения полностью страницы кошелька
            this.listenTo(Backbone, 'WEBPassport.Views.TransferBonuses:clearAll', this.clearAll);

            var $this = this;

            // рендерим данные
            this.listenTo(Backbone, 'WEBPassport.Views.TransferBonuses.SalemPay_Item:render_TransferBonuses.SalemPay_Item', this.setData);

            ons.createDialog('template_select_dialog').then(function (dialog) {
                dialog.getDeviceBackButtonHandler().disable();

                $this.selectOptionsDialog = new WEBPassport.Views.HelpersDropDownList({
                    el: dialog._element[0],
                    model: new Backbone.Model({
                        destroyTrigger: "TransferBonuses.clearAll",
                        selectedTrigger: "WEBPassport.Views.TransferBonuses.SalemPay_Item",
                        id: "TransferBonuses.SalemPay_Item",
                        list: listMaskPhone.list,
                        templateSelectItem: "#template_country_select_options_item"
                    }),// передаем модель
                });
                $this.selectOptionsDialog.dialog = dialog;
                $this.selectOptionsDialog.$el.i18n();
            });

            _.bindAll(this, 'setData', 'onSuccess');
        },
        onRender: function () {
            console.log("WEBPassport.Views.TransferBonuses.SalemPay_Item:onRender");
            var $this = this;

            this.setData(listMaskPhone.selectedMask);

            this.ui.sum_input.inputmask();

            ons.compile(this.$el.get(0));
            this.$el.i18n();
        },
        showAdressBook: function () {
            console.log("WEBPassport.Views.TransferBonuses.SalemPay_Item:showAdressBook");

            if (isMobile) {
                ShowAdressBook(this.ui.phone_input, this.setData);
            }
        },

        onSendClick: function () {
            console.log("WEBPassport.Views.TransferBonuses.SalemPay_Item:onSendClick");
            var $this = this;
            var model = $this.getModel();

            if (!model.phone || !model.amount) {
                ShowAlert(i18n.t('wbs_p2p_monexy_error_msg'));
                return;
            }

            ShowLoader();

            // отправка запроса
            WEBPassport.requestModel.withdrawBonusesEWallet(model.phone, model.amount, $this.onSuccess);
        },
        //получить заполненную модель формы
        getModel: function () {
            console.log("WEBPassport.Views.TransferBonuses.SalemPay_Item:getModel");
            var model = {
                phone: this.ui.phone_input.val(),
                amount: parseFloat(this.ui.sum_input.inputmask('unmaskedvalue')),
            };

            return model;
        },

        onSuccess: function (model, response, options) {
            console.log("WEBPassport.Views.TransferBonuses.SalemPay_Item:onSuccess");
            HideLoader();
            ShowAlert(i18n.t('wbs_transfer_succees'));

            this.ui.sum_input.val("");
            this.ui.phone_input.val("");
        },

        clearAll: function () {
            console.log("WEBPassport.Views.TransferBonuses.SalemPay_Item:clearAll");

            this.stopListening();
            this.undelegateEvents();
            this.destroy();
        },

        // клик на кнопку выбора маски
        selectPhoneMask: function () {
            console.log("WEBPassport.Views.TransferBonuses.SalemPay_Item:selectPhoneMask");
            this.selectOptionsDialog.dialog.show();
        },

        setData: function (data) {
            console.log("WEBPassport.Views.TransferBonuses.SalemPay_Item:setData");
            this.selectedPhoneMask = data;
            // сохраняем изменения
            listMaskPhone.setActive(data);
            if (this.selectOptionsDialog) this.selectOptionsDialog.renderData(data);

            this.ui.iso.text(data.iso);

            this.ui.phone_input.attr("placeholder", data.mask.replace(/x/g, "_"));
            $(this.ui.phone_input).inputmask('remove');

            this.ui.phone_input.inputmask(
             {
                 mask: data.mask,
                 placeholder: "_", greedy: false,
                 definitions: {
                     "x": {
                         validator: "[0-9]",
                         cardinality: 1,
                         definitionSymbol: "x"
                     }
                 }
             });

        },
    });
    */

    // вьюшка вкладки
    var BalanceMobile_Item = Marionette.ItemView.extend({
        template: '#template_balance_mobile_Item',
        ui: {
            phone_input: "#phone_input",
			operator_input: "#operator_input",
            sum_input: "#sum_input",
            send_btn: "#send_btn",
            address_book_btn: "#address-book-btn", // кнопка телефонной книги
            select_phone_mask: "#select_phone_mask", // кнопка выбора маски
            iso: "#iso", // iso страны
        },
        events: {
            'click @ui.send_btn': "onSendClick", // нажатие на кнопку оплатить
            'click @ui.address_book_btn': 'showAdressBook', // открыть телефонный справочник
            'click @ui.select_phone_mask': 'selectPhoneMask', // клик на кнопку выбора маски
        },
        initialize: function () {
            console.log("WEBPassport.Views.TransferBonuses.BalanceMobile_Item:initialize");

            // для уничтожения полностью страницы кошелька
            this.listenTo(Backbone, 'WEBPassport.Views.TransferBonuses:clearAll', this.clearAll);

            var $this = this;

            // рендерим данные
            this.listenTo(Backbone, 'WEBPassport.Views.TransferBonuses.BalanceMobile_Item:render_TransferBonuses.BalanceMobile_Item', this.setData);

            ons.createDialog('template_select_dialog').then(function (dialog) {
                dialog.getDeviceBackButtonHandler().disable();

                $this.selectOptionsDialog = new WEBPassport.Views.HelpersDropDownList({
                    el: dialog._element[0],
                    model: new Backbone.Model({
                        destroyTrigger: "TransferBonuses.clearAll",
                        selectedTrigger: "WEBPassport.Views.TransferBonuses.BalanceMobile_Item",
                        id: "TransferBonuses.BalanceMobile_Item",
                        list: listMaskPhone.list,
                        templateSelectItem: "#template_country_select_options_item"
                    }),// передаем модель
                });
                $this.selectOptionsDialog.dialog = dialog;
                $this.selectOptionsDialog.$el.i18n();
            });

            _.bindAll(this, 'setData', 'onSuccess');
        },
        onRender: function () {
            console.log("WEBPassport.Views.TransferBonuses.BalanceMobile_Item:onRender");
            var $this = this;

            document.getElementsByClassName("fix1")[0].value = localStorage.phone;
            // this.setData(listMaskPhone.selectedMask);
            // this.ui.sum_input.inputmask();
            ons.compile(this.$el.get(0));
            this.$el.i18n();
        },

        showAdressBook: function () {
            console.log("WEBPassport.Views.TransferBonuses.BalanceMobile_Item:showAdressBook");

            if (isMobile) {
                ShowAdressBook(this.ui.phone_input, this.setData);
            }
        },

        onSendClick: function () {
            console.log("WEBPassport.Views.TransferBonuses.BalanceMobile_Item:onSendClick");
            var $this = this;
            var model = $this.getModel();

            if (!model.phone || !model.amount) {
                ShowAlert(i18n.t('wbs_p2p_monexy_error_msg'));
                return;
            }
			else
			if( !model.operator )
			{
				ShowAlert("Выберите оператора мобильной связи");
				return;
			}

            ShowLoader();

			console.log("transfer_balance_model:" + JSON.stringify(model));
            // отправка запроса
            WEBPassport.requestModel.withdrawBonusesPhone(model.phone, model.amount, model.operator, $this.onSuccess);
        },
        //получить заполненную модель формы
        getModel: function () {
            console.log("WEBPassport.Views.TransferBonuses.BalanceMobile_Item:getModel");

			var op_code =
			{
				"Kcell" : "kcell",
				"Beeline (KZ)" : "beeline",
				"Tele2" : "tele2",
				"Altel 4G" : "Altel 4G",
				"Казахтелеком": "kazakhtelecom_phone",
				"Beeline (KG)": "beeline_kyrgyzstan"
				//"Megacom": "megacom_kyrgyzstan",
				//"O!": "o_kyrgyzstan"
			};

            var model = {
                phone: this.ui.phone_input.val(),
                amount: parseFloat(this.ui.sum_input.inputmask('unmaskedvalue')),
				operator: op_code[this.ui.operator_input.val()],
            };

            return model;
        },
        onSuccess: function (model, response, options) {
            console.log("WEBPassport.Views.TransferBonuses.BalanceMobile_Item:onSuccess");
            HideLoader();
            ShowAlert(i18n.t('wbs_transfer_succees'));
        },
        clearAll: function () {
            console.log("WEBPassport.Views.TransferBonuses.BalanceMobile_Item:clearAll");

            this.stopListening();
            this.undelegateEvents();
            this.destroy();
        },


        // клик на кнопку выбора маски
        selectPhoneMask: function () {
            console.log("WEBPassport.Views.TransferBonuses.BalanceMobile_Item:selectPhoneMask");
            this.selectOptionsDialog.dialog.show();
        },

        setData: function (data) {
            console.log("WEBPassport.Views.TransferBonuses.BalanceMobile_Item:setData");
            this.selectedPhoneMask = data;
            // сохраняем изменения
            listMaskPhone.setActive(data);
            if (this.selectOptionsDialog) this.selectOptionsDialog.renderData(data);

            this.ui.iso.text(data.iso);

            this.ui.phone_input.attr("placeholder", data.mask.replace(/x/g, "_"));
            $(this.ui.phone_input).inputmask('remove');

            this.ui.phone_input.inputmask(
             {
                 mask: data.mask,
                 placeholder: "_", greedy: false,
                 definitions: {
                     "x": {
                         validator: "[0-9]",
                         cardinality: 1,
                         definitionSymbol: "x"
                     }
                 }
             });

        },

    });


});
ons.ready(function () {
    // Акции и предложения
    WEBPassport.Views.PromotionsAndOffersDreamclubWidget = WEBPassport.Views.IWidget.extend({
        template: function (serialized_model) {
            return _.template($('#template_widget_promotions_and_offers_dreamclub_2_2').html())(serialized_model);
        },
        ui: {
            content_widget: "#content_widget",
        },
        initializeAfter: function (options) {
            console.log("WEBPassport.Views.PromotionsAndOffersDreamclubWidget:initializeAfter");
        },
        events: {
            "hold": "holdMenu",
            "click": "openScreen", // перейти к форме
        },
        onRenderAfter: function () {
            console.log("WEBPassport.Views.PromotionsAndOffersDreamclubWidget:onRenderAfter");

            return true;
        },
        // перейти к форме  ( клик на вижет)
        openScreen: function (e) {
            // в режими редактирования ни куда не переходим
            if (!isEditDashboard)
                mobipayNavigatorOpen(
                  mobipayPage.promotions_and_offers_dreamclub,
                  "left",
                  { backgroundColor: $(this.ui.content_widget).css("background-color") }
              );
        },
    });

});
ons.ready(function () {

    //Вьюшка для страницы PromotionsAndOffersDreamclub
    WEBPassport.Views.PromotionsAndOffersDreamclub = WEBPassport.IViews.extend({
        el: "#page_promotions_and_offers_dreamclub",
        template: '#template_promotions_and_offers_dreamclub_content',
        ui: {
            back_btn: "#back_btn", // кнопка назад
            history: "#history",
            emptyList: "#emptyList",
            info_btn: "#info_btn", //кнопка вызова справки
            balance_header: "#balance_header",//  баланс хеадер
        },
        events: {
            'click @ui.back_btn': 'returnBeforeToMainForm', // нажатие кнопки назад
            'click @ui.info_btn': 'openHalp', // нажатие кнопки справа
            'click @ui.balance_header': 'goBalanceBonuses',
        },
        initializeAfter: function () {
            console.log("WEBPassport.Views.PromotionsAndOffersDreamclub:initializeAfter");
            this.listenTo(Backbone, "WEBPassport.Views.PromotionsAndOffersDreamclub:returnToMainForm", this.returnToMainForm);
            this.listenTo(Backbone, "WEBPassport.Views.BalanceBonuses:balanceBonusHeader", this.balanceBonusHeader);
            _.bindAll(this, "onSuccessAfter");
        },
        onRender: function () {
            console.log("WEBPassport.Views.PromotionsAndOffersDreamclub:onRender");
            var $this = this;

            $this.isLock = true;
            setTimeout(function () {
                $this.updateHistory();
                $this.isLock = false;
            }, window.settings.isEffects ? timeoutRender : 0);

            ons.compile(this.$el.get(0));
            this.$el.i18n();
            this.updateCSS();

            window.backgroundColor = this.model.attributes.backgroundColor;
        },

        // обновить историю
        updateHistory: function () {
            console.log("WEBPassport.Views.PromotionsAndOffersDreamclub:updateHistory");
            if (isMobile)
                window.analytics.trackEvent(localStorage.devType, 'click', 'P2P History', null);

            ShowLoader();

            var partner_id = null;
            if (this.model.attributes.partner_id)
                partner_id = this.model.attributes.partner_id;
				console.log("partner_id: " + partner_id);
            // отправка запроса
            WEBPassport.requestModel.getListActions(partner_id, {}, this.onSuccessAfter);
        },

        // возврат на предыдующее окно
        returnBeforeToMainForm: function () {
            console.log("WEBPassport.Views.PromotionsAndOffersDreamclub:returnBeforeToMainForm");
            var callback = function () {
                Backbone.trigger("PromotionsAndOffersDreamclub.Destroy");
            };
            this.returnToMainForm(callback);
        },

        onSuccessAfter: function (model, response, options) {
            console.log("WEBPassport.Views.PromotionsAndOffersDreamclub:onSuccessAfter");
            console.log("shares_response: " + JSON.stringify(response));
			HideLoader();
            // если объект DOM удален
            if (jQuery.type(this.ui.back_btn) == "string") return;

            var dateGroup;
            if (response.data.items && response.data.items.length > 0) {
                this.ui.history.show();
                this.ui.emptyList.hide();
                // рендерим страницы карусели и виджеты на ней
                this.walletHistoryCollectionView = new HistoryCollectionView({
                    collection: new Backbone.Collection(response.data.items),
                    el: this.ui.history
                }).render();
            }
            else {
                this.ui.history.hide();
                this.ui.emptyList.show();
            }
        },
        updateCSS: function () {
            console.log("WEBPassport.Views.PromotionsAndOffersDreamclub:updateCSS");

            var a = window.innerHeight - $(this.el).find("ons-toolbar").outerHeight(true) + 1;

            this.ui.history.css("height", a + "px");
            this.ui.emptyList.css("height", a + "px");
        },
        // клик по кнопка помощь
        openHalp: function () {
            console.log("WEBPassport.Views.PromotionsAndOffersDreamclub:openHalp");

            mobipayNavigatorOpen(mobipayPage.halp, "lift", {
                info_text: i18n.t('wbs_info_promotions_and_offers_dream'),
                backgroundColor: this.model.attributes.backgroundColor
            });
        },

        balanceBonusHeader: function (balance) {
            console.log("WEBPassport.Views.PromotionsAndOffersDreamclub:balancePromoHeader");

            if (this.ui.balance_header.length != 0) {
                this.ui.balance_header.text(balance)
            }
        },
        goBalanceBonuses: function () {
            console.log("WEBPassport.Views.PromotionsAndOffersDreamclub:goBalanceBonuses");
            mobipayNavigatorOpen(mobipayPage.balance_bonuses, "left");
        },
    });

    // вьшка для строки в списке
    var HistoryItemView = Marionette.ItemView.extend({
        tagName: "ons-list-item",
        // className: "carousel_optimization",
        template: '#template_promotions_and_offers_dreamclub_item',
        ui: {
            amount: "#amount", // строка суммы
            amount_value: "#amount_value", // сумма
            label_number: "#label_number"
        },
        events: {
            'click': 'openInfo'
        },
        initialize: function (options) {
            //построить/привязать UI елементы
            this.bindUIElements();
        },
        onBeforeRender: function () {
            //if (!(this.model.attributes.amount.indexOf('.') > 0))
            //    this.model.attributes.amount = this.model.attributes.amount + ".00";
        },
        onRender: function () {
            //this.ui.label_number.unmask().mask("00**  ****  ****  0000", { reverse: true });

            //if (this.model.attributes.amount)

            //    this.ui.amount_value.unmask().mask("# ##0.00", { reverse: true });
        },
        openInfo: function () {
            console.log("WEBPassport.Views.PromotionsAndOffersDreamclub.HistoryItemView:openInfo");
            mobipayNavigatorOpen(mobipayPage.promotions_and_offers_dreamclub_item_info, "left", this.model.attributes);
        }
    });

    // коллекция
    var HistoryCollectionView = Marionette.CollectionView.extend({
        childView: HistoryItemView,
        onRender: function () {
            console.log("WEBPassport.Views.PromotionsAndOffersDreamclub.HistoryCollectionView:onRender");
            // ons.compile(this.$el.get(0));
            ons.compile(this.$el.get(0));
        },

        //getChildView: function (item) {
        //    if (item.attributes.type)
        //        return HistoryHeaderItemView;
        //    else
        //        return HistoryItemView;
        //},
    });


    //Вьюшка для страницы подробно
    WEBPassport.Views.PromotionsAndOffersDreamclubInfo = WEBPassport.IViews.extend({
        el: "#page_promotions_and_offers_dreamclub_item_info",
        template: '#template_promotions_and_offers_dreamclub_item_info_content',
        ui: {
            back_btn: "#back_btn", // кнопка назад
            list_campaigns: "#list_campaigns",
            emptyList: "#emptyList",
            list: "#list",
            row_body: "#row_body",
            info_btn: "#info_btn", //кнопка вызова справки'
            balance_header: "#balance_header",//  баланс хеадер
        },
        events: {
            'click @ui.back_btn': 'returnBeforeToMainForm', // нажатие кнопки назад
            'click @ui.info_btn': 'openHalp', // нажатие кнопки справа
            'click @ui.balance_header': 'goBalanceBonuses',
        },
        initializeAfter: function () {
            console.log("WEBPassport.Views.PromotionsAndOffersDreamclubInfo:initializeAfter");
            this.listenTo(Backbone, "WEBPassport.Views.PromotionsAndOffersDreamclubInfo:returnToMainForm", this.returnToMainForm);
            this.listenTo(Backbone, "WEBPassport.Views.BalanceBonuses:balanceBonusHeader", this.balanceBonusHeader);
            // _.bindAll(this, "onSuccessAfter");
        },
        onRender: function () {
            console.log("WEBPassport.Views.PromotionsAndOffersDreamclubInfo:onRender");

            //// отправка запроса
            //WEBPassport.requestModel.getListActions(this.model.attributes.id, this.onSuccessAfter);

            if (wlPath != "DreamClub") {
                this.ui.list.show();
                this.ui.emptyList.hide();
                var df = new Array();
                df.push(this.model.attributes.partner);
                this.campaignsCollectionView = new CampaignsCollectionView({
                    collection: new Backbone.Collection(df),
                    el: this.ui.list_campaigns
                }).render();
            }

            ons.compile(this.$el.get(0));
            this.$el.i18n();
            this.updateCSS();
        },

        //onSuccessAfter: function (model, response, options) {
        //    console.log("WEBPassport.Views.PromotionsAndOffersDreamclubInfo:onSuccessAfter");
        //    HideLoader();
        //    var $this = this;
        //    // если объект DOM удален
        //    if (jQuery.type(this.ui.list) == "string") return;

        //    if (response.data.items && response.data.items.length > 0) {
        //        this.ui.list.show();
        //        this.ui.emptyList.hide();

        //        this.campaignsCollectionView = new CampaignsCollectionView({
        //            collection: new Backbone.Collection(response.data.items),
        //            el: this.ui.list_campaigns
        //        }).render();
        //    }
        //    else {
        //        this.ui.list.hide();
        //        this.ui.emptyList.show();
        //    }
        //},

        // возврат на предыдующее окно
        returnBeforeToMainForm: function () {
            this.returnToMainForm();
        },
        updateCSS: function () {
            console.log("WEBPassport.Views.PromotionsAndOffersDreamclubInfo:updateCSS");

            var a = window.innerHeight - $(this.el).find("ons-toolbar").outerHeight(true) + 1;
            $(this.el).find("ons-toolbar").css("background", "#8f6b89");
            this.ui.row_body.css("height", a + "px");
        },
        // клик по кнопка помощь
        openHalp: function () {
            console.log("WEBPassport.Views.PromotionsAndOffersDreamclubInfo:openHalp");

            mobipayNavigatorOpen(mobipayPage.halp, "lift", {
                info_text: i18n.t('wbs_info_promotions_and_offers_dream'),
                backgroundColor: window.backgroundColor
            });
        },

        balanceBonusHeader: function (balance) {
            console.log("WEBPassport.Views.PromotionsAndOffersDreamclubInfo:balancePromoHeader");

            if (this.ui.balance_header.length != 0) {
                this.ui.balance_header.text(balance)
            }
        },
        goBalanceBonuses: function () {
            console.log("WEBPassport.Views.PromotionsAndOffersDreamclubInfo:goBalanceBonuses");
            mobipayNavigatorOpen(mobipayPage.balance_bonuses, "left");
        },
    });


    // вьшка для строки в списке
    var CampaignsItemView = Marionette.ItemView.extend({
        tagName: "ons-list-item",
        // className: "carousel_optimization",
        template: '#template_promotions_and_offers_dreamclubb_item',
        ui: {
            amount: "#amount", // строка суммы
            amount_value: "#amount_value", // сумма
            label_number: "#label_number"
        },
        events: {
            'click': 'openInfo'
        },
        initialize: function (options) {
            //построить/привязать UI елементы
            this.bindUIElements();
        },
        onRender: function () {
        },
        openInfo: function () {
            mobipayNavigatorOpen(mobipayPage.partners_item_info, "lift", this.model.attributes);
        }
    });

    var CampaignsCollectionView = Marionette.CollectionView.extend({
        childView: CampaignsItemView,
        onRender: function () {
            ons.compile(this.$el.get(0));
        },
    });

    //Вьюшка для страницы подробно
    WEBPassport.Views.PartnersActionInfo = WEBPassport.IViews.extend({
        el: "#page_promotions_and_offers_dreamclubb_action_info",
        template: '#template_promotions_and_offers_dreamclubb_action_info_content',
        ui: {
            back_btn: "#back_btn", // кнопка назад
            list_campaigns: "#list_campaigns",
            emptyList: "#emptyList",
            list: "#list",
            row_body: "#row_body",
            info_btn: "#info_btn", //кнопка вызова справки'
            balance_header: "#balance_header",//  баланс хеадер
        },
        events: {
            'click @ui.back_btn': 'returnBeforeToMainForm', // нажатие кнопки назад
            'click @ui.info_btn': 'openHalp', // нажатие кнопки справа
            'click @ui.balance_header': 'goBalanceBonuses',
        },
        initializeAfter: function () {
            console.log("WEBPassport.Views.PartnersActionInfo:initializeAfter");
            this.listenTo(Backbone, "WEBPassport.Views.PartnersActionInfo:returnToMainForm", this.returnToMainForm);
            this.listenTo(Backbone, "WEBPassport.Views.BalanceBonuses:balanceBonusHeader", this.balanceBonusHeader);
        },
        onRender: function () {
            console.log("WEBPassport.Views.PartnersActionInfo:onRender");

            ons.compile(this.$el.get(0));
            this.$el.i18n();
            this.updateCSS();
        },

        // возврат на предыдующее окно
        returnBeforeToMainForm: function () {
            this.returnToMainForm();
        },
        updateCSS: function () {
            console.log("WEBPassport.Views.PartnersActionInfo:updateCSS");

            var a = window.innerHeight - $(this.el).find("ons-toolbar").outerHeight(true) + 1;

            this.ui.row_body.css("height", a + "px");
        },
        // клик по кнопка помощь
        openHalp: function () {
            console.log("WEBPassport.Views.PartnersActionInfo:openHalp");

            mobipayNavigatorOpen(mobipayPage.halp, "lift", {
                info_text: i18n.t('wbs_info_promotions_and_offers_dream'),
                backgroundColor: window.backgroundColor
            });
        },

        balanceBonusHeader: function (balance) {
            console.log("WEBPassport.Views.PartnersActionInfo:balancePromoHeader");

            if (this.ui.balance_header.length != 0) {
                this.ui.balance_header.text(balance)
            }
        },
        goBalanceBonuses: function () {
            console.log("WEBPassport.Views.PartnersActionInfo:goBalanceBonuses");
            mobipayNavigatorOpen(mobipayPage.balance_bonuses, "left");
        },
    });
});

ons.ready(function () {
    // Акции и предложения
    WEBPassport.Views.PartnersWidget = WEBPassport.Views.IWidget.extend({
        template: function (serialized_model) {
            return _.template($('#template_widget_promotions_and_offers_2_2').html())(serialized_model);
        },
        ui: {
            content_widget: "#content_widget",
        },
        initializeAfter: function (options) {
            console.log("WEBPassport.Views.PartnersWidget:initializeAfter");
        },
        events: {
            "hold": "holdMenu",
            "click": "openScreen", // перейти к форме
        },
        onRenderAfter: function () {
            console.log("WEBPassport.Views.PartnersWidget:onRenderAfter");

            return true;
        },
        // перейти к форме  ( клик на вижет)
        openScreen: function (e) {
            // в режими редактирования ни куда не переходим
            if (!isEditDashboard)
                mobipayNavigatorOpen(
                  mobipayPage.partners,
                  "left",
                  { backgroundColor: $(this.ui.content_widget).css("background-color") }
              );
        },
    });

});
ons.ready(function () {

    //Вьюшка для страницы  Акции и предложения
    WEBPassport.Views.Partners = WEBPassport.IViews.extend({
        el: "#page_partners",
        template: '#template_partners_content',
        ui: {
            back_btn: "#back_btn", // кнопка назад
            top_tab_bar_partners: "#top_tab_bar_partners", //верхний таб бар
            info_btn: "#info_btn", //кнопка вызова справки
            row_body: "#row_body", // основной контент
            tab_parners: "#tab_parners", // вкладка Кошелек
            tab_map: "#tab_map", // вкладка Перевести
            balance_header: "#balance_header",//  баланс хеадер

            item_1: "#item_1", //карусель страница 1
            item_2: "#item_2", //карусель страница 2
        },
        events: {
            'click @ui.back_btn': 'returnBeforeToMainForm', // нажатие кнопки назад
            'click @ui.info_btn': 'openHalp', // нажатие кнопки справа

            'click @ui.tab_parners': 'goToTabPartenrs', // нажатие на вкладку Парнеры
            'click @ui.tab_map': 'goToTabMap', // нажатие на вкладку Карта
            'click @ui.balance_header': 'goBalanceBonuses',
        },
        initializeAfter: function () {
            console.log("WEBPassport.Views.Partners:initializeAfter");
            this.listenTo(Backbone, "WEBPassport.Views.Partners:returnToMainForm", this.returnToMainForm);
            this.listenTo(Backbone, "WEBPassport.Views.BalanceBonuses:balanceBonusHeader", this.balanceBonusHeader);

        },
        onRender: function () {
            console.log("WEBPassport.Views.Partners:onRender");
            var $this = this;

            $this.isLock = true;
            setTimeout(function () {

                $this.Partners_Item = new Partners_Item({
                    model: new Backbone.Model(),
                    el: $this.ui.item_1
                }).render();

                $this.Map_Item = new Map_Item({
                    model: new Backbone.Model(),
                    el: $this.ui.item_2
                }).render();

                $this.isLock = false;
            }, window.settings.isEffects ? timeoutRender : 0);

            ons.compile(this.$el.get(0));
            this.$el.i18n();
            this.updateCSS();
            window.backgroundColor = this.model.attributes.backgroundColor;
        },

        // возврат на предыдующее окно
        returnBeforeToMainForm: function () {
            var callback = function () {
                Backbone.trigger("Partners.Destroy");
            };
            this.returnToMainForm(callback);
        },

        // нажатие на вкладку Кошелек
        goToTabPartenrs: function () {
            console.log("WEBPassport.Views.Partners:goToTabWallet");
            caruselPartners.setActiveCarouselItemIndex(0);
        },

        // нажатие на вкладку Перевести
        goToTabMap: function () {
            console.log("WEBPassport.Views.Partners:goToTabTransfer");
            caruselPartners.setActiveCarouselItemIndex(1);
        },

        goBalanceBonuses: function () {
            console.log("WEBPassport.Views.Partners:goBalanceBonuses");
            mobipayNavigatorOpen(mobipayPage.balance_bonuses,"left");
        },

        updateCSS: function () {
            console.log("WEBPassport.Views.Partners:updateCSS");

            var a = window.innerHeight - this.ui.top_tab_bar_partners.outerHeight(true) - $(this.el).find("ons-toolbar").outerHeight(true);

            this.ui.row_body.css("height", a + "px");
        },
        // клик по кнопка помощь
        openHalp: function () {
            console.log("WEBPassport.Views.Partners:openHalp");

            mobipayNavigatorOpen(mobipayPage.halp, "lift", {
                info_text: i18n.t('wbs_info_partenrs_dream'),
                backgroundColor: this.model.attributes.backgroundColor
            });
        },

        balanceBonusHeader: function (balance) {
            console.log("WEBPassport.Views.Partners:balancePromoHeader");

            if (this.ui.balance_header.length != 0) {
                this.ui.balance_header.text(balance)
            }
        },
    });

    // вьшка для списка партнеров
    var Partners_Item = Marionette.ItemView.extend({
        template: '#template_partners_item_1',
        ui: {
            history: "#history",
            emptyList: "#emptyList",

        },
        initialize: function () {
            console.log("WEBPassport.Views.Partners.Partners_Item:initialize");

            _.bindAll(this, "onSuccessAfter");
        },
        onRender: function () {
            console.log("WEBPassport.Views.Partners.Partners_Item:onRender");
            var $this = this;

            $this.updateHistory();

            ons.compile(this.$el.get(0));
            this.$el.i18n();
        },
        // обновить историю
        updateHistory: function () {
            console.log("WEBPassport.Views.Partners.updateHistory:onRender");
            if (isMobile)
                window.analytics.trackEvent(localStorage.devType, 'click', 'P2P History', null);

            ShowLoader();

            // отправка запроса
            WEBPassport.requestModel.getListPartners(null, this.onSuccessAfter);
        },

        onSuccessAfter: function (model, response, options) {
            console.log("WEBPassport.Views.Partners:onSuccessAfter");
            HideLoader();
            // если объект DOM удален
            if (jQuery.type(this.ui.history) == "string") return;

            var dateGroup;
            if (response.data.items && response.data.items.length > 0) {
                this.ui.history.show();
                this.ui.emptyList.hide();
                // рендерим страницы карусели и виджеты на ней
                this.walletHistoryCollectionView = new HistoryCollectionView({
                    collection: new Backbone.Collection(response.data.items),
                    el: this.ui.history
                }).render();
            }
            else {
                this.ui.history.hide();
                this.ui.emptyList.show();
            }
        },
    });

    // вьшка для страницы карта
    var Map_Item = Marionette.ItemView.extend({
        template: '#template_partners_item_2',
        ui: {
            iframe_map_partners: "#iframe_map_partners",
        },
        initialize: function () {
            console.log("WEBPassport.Views.Partners.Map_Item:initialize");
        },
        onRender: function () {
            console.log("WEBPassport.Views.Partners.Map_Item:onRender");
            var $this = this;

            ons.compile(this.$el.get(0));
            this.$el.i18n();
        },
    });

    // вьшка для строки в списке
    var HistoryItemView = Marionette.ItemView.extend({
        tagName: "ons-list-item",
        // className: "carousel_optimization",
        template: '#template_partners_item',
        ui: {
            amount: "#amount", // строка суммы
            amount_value: "#amount_value", // сумма
            label_number: "#label_number"
        },
        events: {
            'click': 'openInfo'
        },
        initialize: function (options) {
            //построить/привязать UI елементы
            this.bindUIElements();
        },
        onBeforeRender: function () {
            //if (!(this.model.attributes.amount.indexOf('.') > 0))
            //    this.model.attributes.amount = this.model.attributes.amount + ".00";
        },
        onRender: function () {
            //this.ui.label_number.unmask().mask("00**  ****  ****  0000", { reverse: true });

            //if (this.model.attributes.amount)

            //    this.ui.amount_value.unmask().mask("# ##0.00", { reverse: true });
        },
        openInfo: function () {
            mobipayNavigatorOpen(mobipayPage.partners_item_info, "left", this.model.attributes);
        }
    });

    // коллекция
    var HistoryCollectionView = Marionette.CollectionView.extend({
        childView: HistoryItemView,
        onRender: function () {
            console.log("WEBPassport.Views.HistoryHeaderItemView:onRender");
            // ons.compile(this.$el.get(0));
            ons.compile(this.$el.get(0));
        },

        //getChildView: function (item) {
        //    if (item.attributes.type)
        //        return HistoryHeaderItemView;
        //    else
        //        return HistoryItemView;
        //},
    });


    //Вьюшка для страницы подробно
    WEBPassport.Views.PartnersInfo = WEBPassport.IViews.extend({
        el: "#page_partners_item_info",
        template: '#template_partners_item_info_content',
        ui: {
            back_btn: "#back_btn", // кнопка назад
            list_campaigns: "#list_campaigns",
            emptyList: "#emptyList",
            list: "#list",
            row_body: "#row_body",
            info_btn: "#info_btn", //кнопка вызова справки
            balance_header: "#balance_header",//  баланс хеадер

            campaigns_btn: "#campaigns_btn",
            info_partner_btn: "#info_partner_btn",
            contakt_btn: "#contakt_btn",
        },
        events: {
            'click @ui.back_btn': 'returnBeforeToMainForm', // нажатие кнопки назад
            'click @ui.info_btn': 'openHalp', // нажатие кнопки справа

            'click @ui.campaigns_btn': 'openCampaigns', // нажатие кнопки акции
            'click @ui.info_partner_btn': 'openInfoPartner', // нажатие кнопки описание
            'click @ui.contakt_btn': 'openContakt', // нажатие кнопки контакты
            'click @ui.balance_header': 'goBalanceBonuses',
        },
        initializeAfter: function () {
            console.log("WEBPassport.Views.PartnersInfo:initializeAfter");
            this.listenTo(Backbone, "WEBPassport.Views.PartnersInfo:returnToMainForm", this.returnToMainForm);
            this.listenTo(Backbone, "WEBPassport.Views.BalanceBonuses:balanceBonusHeader", this.balanceBonusHeader);
            _.bindAll(this, "onSuccessAfter");
        },
        onRender: function () {
            console.log("WEBPassport.Views.PartnersInfo:onRender");

            if (wlPath != "DreamClub")
                // отправка запроса
                WEBPassport.requestModel.getListActions(this.model.attributes.id, this.onSuccessAfter);
            else
            {

            }
            ons.compile(this.$el.get(0));
            this.$el.i18n();
            this.updateCSS();
        },

        onSuccessAfter: function (model, response, options) {
            console.log("WEBPassport.Views.PartnersInfo:onSuccessAfter");
            HideLoader();
            var $this = this;
            // если объект DOM удален
            if (jQuery.type(this.ui.list) == "string") return;

            if (response.data.items && response.data.items.length > 0) {
                this.ui.list.show();
                this.ui.emptyList.hide();

                this.campaignsCollectionView = new CampaignsCollectionView({
                    collection: new Backbone.Collection(response.data.items),
                    el: this.ui.list_campaigns
                }).render();
            }
            else {
                this.ui.list.hide();
                this.ui.emptyList.show();
            }
        },

        // возврат на предыдующее окно
        returnBeforeToMainForm: function () {
            this.returnToMainForm();
        },
        updateCSS: function () {
            console.log("WEBPassport.Views.PartnersInfo:updateCSS");

            var a = window.innerHeight - $(this.el).find("ons-toolbar").outerHeight(true) + 1;

            this.ui.row_body.css("height", a + "px");
        },
        // клик по кнопка помощь
        openHalp: function () {
            console.log("WEBPassport.Views.PartnersInfo:openHalp");

            mobipayNavigatorOpen(mobipayPage.halp, "lift", {
                info_text: i18n.t('wbs_info_partenrs_dream'),
                backgroundColor: window.backgroundColor
            });
        },

        // нажатие кнопки акции
        openCampaigns: function () {
            console.log("WEBPassport.Views.PartnersInfo:openCampaigns");
            mobipayNavigatorOpen(
               mobipayPage.promotions_and_offers_dreamclub,
               "lift",
               {
                   backgroundColor: window.backgroundColor,
                   partner_id: this.model.attributes.id,
               }
           );
        },

        // нажатие кнопки описание
        openInfoPartner: function () {
            console.log("WEBPassport.Views.PartnersInfo:openInfoPartner");

            mobipayNavigatorOpen(mobipayPage.partners_item_info_opis, "lift", {
                info_patner: this.model.attributes,
                backgroundColor: window.backgroundColor
            });
        },

        // нажатие кнопки контакты
        openContakt: function () {
            console.log("WEBPassport.Views.PartnersInfo:openContakt");

            mobipayNavigatorOpen(mobipayPage.partners_item_info_contact, "lift", {
                info_patner: this.model.attributes,
                backgroundColor: window.backgroundColor
            });
        },

        balanceBonusHeader: function (balance) {
            console.log("WEBPassport.Views.PartnersInfo:balancePromoHeader");

            if (this.ui.balance_header.length != 0) {
                this.ui.balance_header.text(balance)
            }
        },

        goBalanceBonuses: function () {
            console.log("WEBPassport.Views.PartnersInfo:goBalanceBonuses");
            mobipayNavigatorOpen(mobipayPage.balance_bonuses, "left");
        },

    });


    // вьшка для строки в списке
    var CampaignsItemView = Marionette.ItemView.extend({
        tagName: "ons-list-item",
        // className: "carousel_optimization",
        template: '#template_paodcb_item',
        ui: {
            amount: "#amount", // строка суммы
            amount_value: "#amount_value", // сумма
            label_number: "#label_number"
        },
        events: {
            'click': 'openInfo'
        },
        initialize: function (options) {
            //построить/привязать UI елементы
            this.bindUIElements();
        },
        onRender: function () {
        },
        openInfo: function () {
            mobipayNavigatorOpen(mobipayPage.paodcb_action_info, "lift", this.model.attributes);
        }
    });

    var CampaignsCollectionView = Marionette.CollectionView.extend({
        childView: CampaignsItemView,
        onRender: function () {
            ons.compile(this.$el.get(0));
        },
    });

    //Вьюшка для страницы подробно
    WEBPassport.Views.PartnersActionInfo = WEBPassport.IViews.extend({
        el: "#page_paodcb_action_info",
        template: '#template_paodcb_action_info_content',
        ui: {
            back_btn: "#back_btn", // кнопка назад
            list_campaigns: "#list_campaigns",
            emptyList: "#emptyList",
            list: "#list",
            row_body: "#row_body",
            info_btn: "#info_btn", //кнопка вызова справки
            balance_header: "#balance_header",//  баланс хеадер
        },
        events: {
            'click @ui.back_btn': 'returnBeforeToMainForm', // нажатие кнопки назад
            'click @ui.info_btn': 'openHalp', // нажатие кнопки справа
            'click @ui.balance_header': 'goBalanceBonuses',
        },
        initializeAfter: function () {
            console.log("WEBPassport.Views.PartnersActionInfo:initializeAfter");
            this.listenTo(Backbone, "WEBPassport.Views.PartnersActionInfo:returnToMainForm", this.returnToMainForm);
            this.listenTo(Backbone, "WEBPassport.Views.BalanceBonuses:balanceBonusHeader", this.balanceBonusHeader);

        },
        onRender: function () {
            console.log("WEBPassport.Views.PartnersActionInfo:onRender");

            ons.compile(this.$el.get(0));
            this.$el.i18n();
            this.updateCSS();
        },

        // возврат на предыдующее окно
        returnBeforeToMainForm: function () {
            this.returnToMainForm();
        },
        updateCSS: function () {
            console.log("WEBPassport.Views.PartnersActionInfo:updateCSS");

            var a = window.innerHeight - $(this.el).find("ons-toolbar").outerHeight(true) + 1;

            this.ui.row_body.css("height", a + "px");
        },
        // клик по кнопка помощь
        openHalp: function () {
            console.log("WEBPassport.Views.PartnersActionInfo:openHalp");

            mobipayNavigatorOpen(mobipayPage.halp, "lift", {
                info_text: i18n.t('wbs_info_partenrs_dream'),
                backgroundColor: window.backgroundColor
            });
        },

        balanceBonusHeader: function (balance) {
            console.log("WEBPassport.Views.PartnersActionInfo:balancePromoHeader");

            if (this.ui.balance_header.length != 0) {
                this.ui.balance_header.text(balance)
            }
        },

        goBalanceBonuses: function () {
            console.log("WEBPassport.Views.PartnersActionInfo:goBalanceBonuses");
            mobipayNavigatorOpen(mobipayPage.balance_bonuses, "left");
        },

    });


    //Вьюшка для страницы подробно
    WEBPassport.Views.PartnersInfoContact = WEBPassport.IViews.extend({
        el: "#page_partners_item_info_contact",
        template: '#template_partners_item_info_contact_content',
        ui: {
            back_btn: "#back_btn", // кнопка назад
            balance_header: "#balance_header",//  баланс хеадер

            row_body: "#row_body",
        },
        events: {
            'click @ui.back_btn': 'returnBeforeToMainForm', // нажатие кнопки назад
            'click @ui.balance_header': 'goBalanceBonuses',
        },
        initializeAfter: function () {
            console.log("WEBPassport.Views.PartnersInfoContact:initializeAfter");
            this.listenTo(Backbone, "WEBPassport.Views.PartnersInfoContact:returnToMainForm", this.returnToMainForm);
            this.listenTo(Backbone, "WEBPassport.Views.BalanceBonuses:balanceBonusHeader", this.balanceBonusHeader);

        },
        onRender: function () {
            console.log("WEBPassport.Views.PartnersInfoContact:onRender");

            ons.compile(this.$el.get(0));
            this.$el.i18n();
            this.updateCSS();
        },

        // возврат на предыдующее окно
        returnBeforeToMainForm: function () {
            this.returnToMainForm();
        },
        updateCSS: function () {
            console.log("WEBPassport.Views.PartnersInfoContact:updateCSS");

            var a = window.innerHeight - $(this.el).find("ons-toolbar").outerHeight(true) + 1;

            this.ui.row_body.css("height", a + "px");
        },
    });


    //Вьюшка для страницы подробно
    WEBPassport.Views.PartnersInfoOpis = WEBPassport.IViews.extend({
        el: "#page_partners_item_info_opis",
        template: '#template_partners_item_info_opis_content',
        ui: {
            back_btn: "#back_btn", // кнопка назад
            row_body: "#row_body",
            balance_header: "#balance_header",//  баланс хеадер
        },
        events: {
            'click @ui.back_btn': 'returnBeforeToMainForm', // нажатие кнопки назад
            'click @ui.balance_header': 'goBalanceBonuses',
        },
        initializeAfter: function () {
            console.log("WEBPassport.Views.PartnersInfoOpis:initializeAfter");
            this.listenTo(Backbone, "WEBPassport.Views.PartnersInfoOpis:returnToMainForm", this.returnToMainForm);
            this.listenTo(Backbone, "WEBPassport.Views.BalanceBonuses:balanceBonusHeader", this.balanceBonusHeader);

        },
        onRender: function () {
            console.log("WEBPassport.Views.PartnersInfoOpis:onRender");

            ons.compile(this.$el.get(0));
            this.$el.i18n();
            this.updateCSS();
        },

        // возврат на предыдующее окно
        returnBeforeToMainForm: function () {
            this.returnToMainForm();
        },
        updateCSS: function () {
            console.log("WEBPassport.Views.PartnersInfoOpis:updateCSS");

            var a = window.innerHeight - $(this.el).find("ons-toolbar").outerHeight(true) + 1;

            this.ui.row_body.css("height", a + "px");
        },

        balanceBonusHeader: function (balance) {
            console.log("WEBPassport.Views.PartnersInfoOpis:balancePromoHeader");

            if (this.ui.balance_header.length != 0) {
                this.ui.balance_header.text(balance)
            }
        },

        goBalanceBonuses: function () {
            console.log("WEBPassport.Views.PartnersInfoOpis:goBalanceBonuses");
            mobipayNavigatorOpen(mobipayPage.balance_bonuses, "left");
        },
    });
});

ons.ready(function () {
    // Мой QR
    WEBPassport.Views.MyQRDreamClubWidget = WEBPassport.Views.IWidget.extend({
        template: function (serialized_model) {
            return _.template($('#template_widget_MyQR_2_2').html())(serialized_model);
        },
        ui: {
            content_widget: "#content_widget",
        },
        initializeAfter: function (options) {
            console.log("WEBPassport.Views.MyQRDreamClubWidget:initializeAfter");
        },
        events: {
            "hold": "holdMenu",
            "click": "openScreen", // перейти к форме
        },
        onRenderAfter: function () {
            console.log("WEBPassport.Views.MyQRDreamClubWidget:onRenderAfter");

            return true;
        },
        // перейти к форме  ( клик на вижет)
        openScreen: function () {
            console.log("WEBPassport.Views.MyQRDreamClubWidget:openScreen");
           // effectOpenScreen(this.ui.content_widget);

            // в режими редактирования ни куда не переходим
            if (!isEditDashboard)
                mobipayNavigatorOpen(mobipayPage.myqr_dreamclub,
                       "left",
                       { backgroundColor: $(this.ui.content_widget).css("background-color") }
                   );

           //setTimeout(function () { mobipayNavigatorOpen(mobipayPage.myqr, 'none'); }, timeoutAnimate);
        },
    });
});
ons.ready(function () {
    //Вьюшка для страницы Wallet
    WEBPassport.Views.MyQRDreamClub = WEBPassport.IViews.extend({
        el: "#page_myqr_dreamclub",
        template: '#template_myqr_dreamclub_content',
        ui: {
            back_btn: "#back_btn", // кнопка назад
            headerMenu: "#headerMenu", // кнопка вызова меню (справа)
            info_btn: "#info_btn", //кнопка вызова справки
            myqr_url: "#myqr_url",
            balance_header: "#balance_header",//  баланс хеадер
        },
        events: {
            'click @ui.back_btn': 'returnToMainForm', // нажатие кнопки назад
            "click @ui.headerMenu": "openMenu",   // клик по меню открыть
            'click @ui.info_btn': 'openHalp', // нажатие кнопки справа
            'click @ui.balance_header': 'goBalanceBonuses',
        },
        initializeAfter: function () {
            console.log("WEBPassport.Views.MyQRDreamClub:initializeAfter");
            this.listenTo(Backbone, "WEBPassport.Views.MyQRDreamClub:returnToMainForm", this.returnToMainForm);
            this.listenTo(Backbone, "WEBPassport.Views.BalanceBonuses:balanceBonusHeader", this.balanceBonusHeader);
            //  рендерим вьюшку бокового правого меню
            Backbone.trigger('WEBPassport.Views.MainView:renderContextMenu', MyQrMenu);
            _.bindAll(this, "onSuccessAfter");
        },
        onRender: function () {
            console.log("WEBPassport.Views.MyQRDreamClub:onRender");
            if (isMobile) window.analytics.trackEvent(localStorage.devType, 'win_my_qr', 'My QR', null);
            var $this = this;
            $this.isLock = true;
            setTimeout(function () {
                $this.loadQR();
                $this.isLock = false;
            }, window.settings.isEffects ? timeoutRender : 0);

            ons.compile(this.$el.get(0));
            this.$el.i18n();
        },

        loadQR: function () {
            console.log("WEBPassport.Views.MyQRDreamClub:loadQR");
            ShowLoader();
            // отправка запроса
            WEBPassport.requestModel.getQrCod(this.onSuccessAfter);
        },
        onSuccessAfter: function (model, response, options) {
            console.log("WEBPassport.Views.MyQRDreamClub:onSuccessAfter");
            HideLoader();

            // если объект DOM удален
            if (jQuery.type(this.ui.back_btn) == "string") return;

            this.ui.myqr_url.attr("src", response.data.qr_code);
        },

        // клик по меню (справа) открыть
        openMenu: function () {
            console.log("WEBPassport.Views.MyQRDreamClub:openMenu");
            Backbone.trigger("WEBPassport.Views.MainView:openMenu");
        },

        // клик по кнопка помощь
        openHalp: function () {
            console.log("WEBPassport.Views.MyQRDreamClub:openHalp");
            mobipayNavigatorOpen(mobipayPage.halp, "lift", {
                info_text: i18n.t('wbs_info_myqr_dream'),
                backgroundColor: this.model.attributes.backgroundColor
            });
        },
        balanceBonusHeader: function (balance) {
            console.log("WEBPassport.Views.MyQRDreamClub:balancePromoHeader");

            if (this.ui.balance_header.length != 0) {
                this.ui.balance_header.text(balance)
            }
        },
        goBalanceBonuses: function () {
            console.log("WEBPassport.Views.PartnersInfoOpis:goBalanceBonuses");
            mobipayNavigatorOpen(mobipayPage.balance_bonuses, "left");
        },
    });

    //  вьюшка бокового правого меню
    var MyQrMenu = Marionette.ItemView.extend({
        template: "#template-myqr-menu",
        ui: {
            halp: "#halp", // кнопка halp
        },
        events: {
            "click @ui.halp": "openHalp", // клик по кнопка помощь
        },
        initialize: function () {
            console.log("WEBPassport.Views.MyQRDreamClub.MyQrMenu:initialize");
            this.bindUIElements();
        },
        onRender: function () {
            console.log("WEBPassport.Views.MyQRDreamClub.MyQrMenu:onRender");

            ons.compile(this.$el.get(0));
        },

        // клик по кнопка помощь
        openHalp: function () {
            console.log("WEBPassport.Views.MyQRDreamClub.MyQrMenu:openHalp");

            // открываем страницу с задержкой так как
            // сначала закрывается меню боковое и потом мы открываем новую страницу
            setTimeout(function () {
                mobipayNavigatorOpen(mobipayPage.halp, "lift", {
                    helpURL: i18n.t('wbs_myqr_help_url'),
                    backgroundColor: WEBPassport.Views.myQR.model.attributes.backgroundColor
                });
            }, timeoutAnimate);
        }
    });
});
ons.ready(function () {
    // Сканер QR
    WEBPassport.Views.QRScannerDreamClubWidget = WEBPassport.Views.IWidget.extend({
        template: function (serialized_model) {
            return _.template($('#template_widget_qrscanner_2_2').html())(serialized_model);
        },
        ui: {
            content_widget: "#content_widget",
        },
        initializeAfter: function (options) {
            console.log("WEBPassport.Views.QRScannerDreamClubWidget:initializeAfter");
            _.bindAll(this, 'onSuccess', 'onSuccessAccessViaWP', 'onSuccessPay');

        },
        events: {
            "hold": "holdMenu",
            "click": "openScreen", // перейти к форме
        },
        onRenderAfter: function () {
            console.log("WEBPassport.Views.QRScannerDreamClubWidget:onRenderAfter");

            // если был открыт отп


            return true;
        },
        // перейти к форме  ( клик на вижет)
        openScreen: function () {
            console.log("WEBPassport.Views.QRScannerDreamClubWidget:openScreen");
            // в режими редактирования ни куда не переходим
            if (!isEditDashboard) {
                if (isMobile) {
                    this.scanQR();
                }
            }
        },



        scanQR: function () {
            console.log("WEBPassport.Views.QRScannerDreamClubWidget:scanQR");
            window.analytics.trackEvent(localStorage.devType, 'click', 'Scan QR', null);
            var $this = this;

            cloudSky.zBar.scan({ flash: 'off' }, function (result) {
                console.log("WEBPassport.Views.QRScannerDreamClubWidget:scanQR result = ");
                console.log(result);
                return;
                $this.onQRSuccess({ result: result });
            }, function (error) {
                console.log("WEBPassport.Views.QRScannerDreamClubWidget:scanQR error = ");
                console.log(error);
                return;
                if (error == 'cancelled' && sessionStorage.qr && sessionStorage.qr == 'true') {
                    stopListenSMS();
                    if (navigator && navigator.app) {
                        navigator.app.exitApp();
                    }
                    else {
                        if (navigator && navigator.device) {
                            navigator.device.exitApp();
                        }
                    }
                }
            });
        },
        onQRSuccess: function (data) {
            console.log("WEBPassport.Views.QRScannerDreamClubWidget:onQRSuccess data:" + data ? JSON.stringify(data) : "");

            ShowLoader();
            window.analytics.trackEvent(localStorage.devType, 'scan', data.result, null);

            if (data.result.indexOf("otp") != -1 || data.result.indexOf("token") != -1 || data.result.indexOf("inv") != -1 || data.result.indexOf("myqr") != -1) {
                if (data.result.indexOf("otp=") != -1) {
                    var otp = data.result.substring(data.result.indexOf("otp=") + 4);
                    Backbone.trigger("WEBPassport.Views.QRScannerDreamClubWidget:sendOtp", otp, false);
                }

                if (data.result.indexOf("token=") != -1) {
                    if (data.result.indexOf('invoice') > -1) {
                        if (data.result.indexOf('invoicelong') > -1) {
                            var token = data.result.substring(data.result.indexOf("token=") + 6);
                            sessionStorage.token = token;
                            WEBPassport.requestModel.paymentLongQR(localStorage.session, token);
                            // отправка запроса
                            WEBPassport.requestModel.sandData(this.onSuccess);
                        }
                        else {
                            var token = data.result.substring(data.result.indexOf("token=") + 6);
                            sessionStorage.token = token;
                            WEBPassport.requestModel.paymentQR(localStorage.session, token);
                            // отправка запроса
                            WEBPassport.requestModel.sandData(this.onSuccess);
                        }
                    }

                    if (data.result.indexOf('p2p') > -1) {
                        var token = data.result.substring(data.result.indexOf("token=") + 6);
                        //sessionStorage.token = token;
                        WEBPassport.requestModel.p2pQR(localStorage.session, token);
                        // отправка запроса
                        WEBPassport.requestModel.sandData(this.onSuccess);
                    }

                    if (data.result.indexOf('vote') > -1) {
                        var token = data.result.substring(data.result.indexOf("token=") + 6);
                        WEBPassport.requestModel.qrVote(localStorage.session, token);
                        this.options.vote_token = token;
                        // отправка запроса
                        WEBPassport.requestModel.sandData(this.onSuccess);
                    }

                    if (data.result.indexOf('cashback') > -1) {
                        var token = data.result.substring(data.result.indexOf("token=") + 6);
                        WEBPassport.requestModel.cashBack(localStorage.session, token);
                        this.options.vote_token = token;
                        // отправка запроса
                        WEBPassport.requestModel.sandData(this.onSuccess);
                    }
                }

                if (data.result.indexOf("inv=") != -1) {
                    var inv = data.result.substring(data.result.indexOf("inv") + 3);
                    WEBPassport.requestModel.sendInvite(localStorage.session, inv);
                    // отправка запроса
                    WEBPassport.requestModel.sandData(this.onSuccess);
                }

                if (data.result.indexOf("myqr") != -1) {
                    var myqr = data.result.substring(data.result.indexOf("myqr=") + 5);
                    WEBPassport.requestModel.scanMyQR(localStorage.session, myqr);
                    // отправка запроса
                    WEBPassport.requestModel.sandData(this.onSuccess);
                }

            }
            else {
                HideLoader();
                //navigator.notification.alert(i18n.t("wbs_network_error_msg"),null);
                if (data.result.indexOf('http://') == 0 || data.result.indexOf('https://') == 0) {
                    navigator.notification.confirm(i18n.t("wbs_external_qr_msg") + "\n\n" + data.result + "\n", function (buttonIndex) {
                        if (buttonIndex == 1) {
                            window.open(data.result, '_system');
                        }
                    }, "", [i18n.t("wbs_yes_btn"), i18n.t("wbs_no_btn")]);
                }
                else {
                    ShowAlert(data.result);
                }

            }
        },
        onSuccess: function (model, response, options) {
            HideLoader();
            console.log("WEBPassport.Views.QRScannerDreamClubWidget:onSuccess");
            var $this = this;
            switch (model.get('cmd')) {
                // вход сканирование QR
                case cmd_names.CMD_SEND_OTP:
                    {
                        this.options.otpWPs = true;
                        this.options.history_wps = JSON.parse(response.json).history_wps || [];
                        WEBPassport.mainViewModel.set('otphash', JSON.parse(response.json).otphash);
                        WEBPassport.mainViewModel.set('authurl', JSON.parse(response.json).info.url);

                        ShowConfirm(i18n.t("wbs_passport_auto_auth_msg"), function (buttonIndex) {

                            var send = function () {
                                // отправка запроса
                                WEBPassport.requestModel.accessViaWP(localStorage.session, WEBPassport.mainViewModel.get('otphash'));
                                WEBPassport.requestModel.sandData($this.onSuccessAccessViaWP);
                            };

                            switch (buttonIndex) {


                                case 1:// нет
                                    break;
                                case 2://изменить
                                    mobipayNavigatorOpen(mobipayPage.webpassport, "left",
                                        {
                                            backgroundColor: "#00BCD4",
                                            qrScanner: true,
                                            qrScannerCallback: send
                                        });
                                    break;
                                case 3:// да
                                    ShowLoader();
                                    send();
                                    break;
                                default:
                                    ShowAlert(buttonIndex);
                            }

                        }, [i18n.t('wbs_no_btn'), i18n.t('wbs_edit_btn'), i18n.t('wbs_yes_btn')]);
                        break;
                    }

                //оплата покупки
                case cmd_names.CMD_PAYMENT_LONG_QR:
                case cmd_names.CMD_PAYMENT_QR:
                    {
                        var resp = JSON.parse(response.json);
                        mobipayNavigatorOpen(mobipayPage.cart, "left",
                               {
                                   backgroundColor: $(this.ui.content_widget).css("background-color"),
                                   opis: resp.opis,
                                   currency_mask: resp.currency_mask,
                                   amount: resp.amount,
                                   site_domen: resp.site_domen,
                                   site_name: resp.site_name,
                                   keypay: resp.keypay,
                                   products: resp.products,
                                   payments: resp.payments,
                                   fields_app: resp.fields_app,
                                   fromScreen: "qrScaner",
                                   token: resp.token,
                                   callback:  this.isExit ? this.onSuccessPay : ""
                               }
                           );

                        break;
                    }
                // выставленный счет
                case cmd_names.CMD_P2P_QR: {
                    mobipayNavigatorOpen(mobipayPage.p2pcardtocard,
                       "left",
                       {
                           backgroundColor: $(this.ui.content_widget).css("background-color"),
                           modP2P: "qrscanner",
                           p2pqr: JSON.parse(response.json)
                       }
                   );
                    break;
                }

                case cmd_names.CMD_VOTE_QR: {
                    mobipayNavigatorOpen(mobipayPage.scaner_qr_votes,
                      "left",
                      {
                          backgroundColor: $(this.ui.content_widget).css("background-color"),
                          qr_url: JSON.parse(response.json).qr_url,
                          share_vote: JSON.parse(response.json).share,
                          title: JSON.parse(JSON.parse(response.json).vote).title,
                          vote: JSON.parse(response.json).vote,
                          token: this.options.vote_token
                      }
                  );

                    var voteJSON = JSON.parse(response.json).vote;
                    this.options.vote = JSON.parse(response.json).vote;
                    this.model.set('qr_url', JSON.parse(response.json).qr_url);
                    this.model.set('share_vote', JSON.parse(response.json).share);
                    this.model.set('title', JSON.parse(voteJSON).title);
                    this.model.set('state', 'vote.qr');
                    break;
                }

                // кешбек лояльность
                case cmd_names.CMD_CASH_BACK: {
                    ShowAlert(i18n.t("wbs_success_cashback_msg").replace("%amount%", JSON.parse(response.json).amount).replace("%currency%", JSON.parse(response.json).currency), function () {
                        mobipayNavigatorOpen(
                        mobipayPage.loyalty,
                        "left",
                        { backgroundColor:  '#FF7043' }
                    );
                    });
                    break;
                }

                // приглашение
                case cmd_names.CMD_SEND_INVITE:
                    {
                        if (JSON.parse(response.json).success) {
                            ShowAlert(JSON.parse(response.json).msg, function () {
                                if ($this.isExit) {
                                    if (navigator && navigator.app)
                                        navigator.app.exitApp();
                                    else if (navigator && navigator.device)
                                            navigator.device.exitApp();
                                }
                            });
                        }
                        break;
                    }

                // выбор с карты на карты или монекси
                case cmd_names.CMD_SEND_SCAN_MYQR: {
                    mobipayNavigatorOpen(mobipayPage.scaner_qr_myqr,
                       "left",
                       {
                           backgroundColor: $(this.ui.content_widget).css("background-color"),
                           myqr_mobile: JSON.parse(response.json).mobile
                       }
                   );

                    break;
                }
            }
        },
        onSuccessAccessViaWP: function (model, response, options) {
            console.log("WEBPassport.Views.QRScannerDreamClubWidget:onSuccessAccessViaWP");

            if (JSON.parse(response.json).success) {
                if (sessionStorage.qr) {
                    if (navigator && navigator.app)
                        navigator.app.exitApp();

                    else if (navigator && navigator.device)
                        navigator.device.exitApp();
                }

                else if (this.isExit) {
                    if (navigator && navigator.app)
                        navigator.app.exitApp();

                    else if (navigator && navigator.device)
                            navigator.device.exitApp();
                }

                else {
                    ShowAlert(i18n.t('wbs_success_auth_msg'), function () {
                        //view.model.set('state', 'main');
                    });
                }
            }
        },

        onSuccessPay: function (model, response, options) {
            console.log("WEBPassport.Views.QRScannerDreamClubWidget:onSuccessPay");

            if (navigator && navigator.app)
                navigator.app.exitApp();

            else if (navigator && navigator.device)
                navigator.device.exitApp();
        }
    });

});
ons.ready(function () {

    // Web паспорт
    WEBPassport.Views.WebPassportDreamClubWidget = WEBPassport.Views.IWidget.extend({
        template: function (serialized_model) {
            var size_y = serialized_model.type.size_y;
            var size_x = serialized_model.type.size_x;

            if (size_x == 2 && size_y == 2)
                return _.template($('#template_widget_WebPassport_2_2').html())(serialized_model);
            if (size_x >= 3 && size_y >= 3)
                return _.template($('#template_widget_WebPassport_tmpl_1').html())(serialized_model);
            else
                return _.template($('#template_widget_WebPassport_2_2').html())(serialized_model);
        },
        ui: {
            content_widget: "#content_widget",
        },
        initializeAfter: function (options) {
            console.log("WEBPassport.Views.WebPassportDreamClubWidget:initializeAfter");

            this.listenTo(Backbone, "request:updatePhoto", this.updatePhoto);
        },
        events: {
            "hold": "holdMenu",
            "click": "openScreen", // перейти к форме
        },
        onRenderAfter: function () {
            console.log("WEBPassport.Views.WebPassportDreamClubWidget:onRenderAfter");
        },
        updatePhoto: function () {
            console.log("WEBPassport.Views.WebPassportDreamClubWidget:updatePhoto");
            this.model.attributes.photo = WEBPassport.mainViewModel.attributes.photo;
            this.render();
        },
        // перейти к форме  ( клик на вижет)
        openScreen: function (e) {
            console.log("WEBPassport.Views.WebPassportDreamClubWidget:saveSettings");
            //effectOpenScreen(this.ui.content_widget);

            // в режими редактирования ни куда не переходим
            if (!isEditDashboard)
                mobipayNavigatorOpen(
                    mobipayPage.webpassport_dreamclub,
                    "left",
                    { backgroundColor: $(this.ui.content_widget).css("background-color") }
                );
             //   setTimeout(function () { mobipayNavigatorOpen(mobipayPage.webpassport, 'none'); }, timeoutAnimate);
        },
    });
});
ons.ready(function () {
    //Вьюшка для страницы WebPassportDreamClub
    WEBPassport.Views.WebPassportDreamClub = WEBPassport.IViews.extend({
        el: "#page_profile_dreamclub",
        template: '#template_profile_dreamclub_content',
        ui: {
            headerMenu: "#headerMenu", // кнопка вызова меню
            info_btn: "#info_btn", //кнопка вызова справки

            back_btn: "#back_btn", // кнопка назад
            load_photo_btn: "#load_photo-btn", // кнопка обновить фото
            edit_wp: "#edit_wp", // кнопка сохранить изменения

            birthday_input: "#birthday-input", // поле для ввода даты
            fname_input: "#fname-input",// Имя
            lname_input: "#lname-input",//Фамилия
            r_m: "#r_m", // пол
            man: "#man", // пол муж
            woman: "#woman", // пол Жен

            row_form: "#row_form", // строка формы
            row_body: "#row_body", // блок с полями ввода
            balance_header: "#balance_header",//  баланс хеадер
            edit_rm_man: "#edit_rm_man",
            edit_rm_woman: "#edit_rm_woman"
        },
        events: {
            'click @ui.back_btn': 'returnToMainForm', // нажатие кнопки назад
            'click @ui.load_photo_btn': 'changeAvatar', // клик на кнопку обновить фото
            'click @ui.birthday_input': 'showDatepicker', // клик на поле ДР
            'click @ui.edit_wp': "editWP", // клик на кнопку сохранить изменения
            "click @ui.headerMenu": "openMenu",   // клик по меню (справа) открыть
            'change @ui.r_m': 'changeRM', // клик на поле ПОЛ
            'click @ui.info_btn': 'openHalp', // нажатие кнопки справа
            'click @ui.balance_header': 'goBalanceBonuses',

            'click @ui.edit_rm_man': 'selectMan',
            'click @ui.edit_rm_woman': 'selectWoman',
            //'keyup @ui.fname_input': "teststs"
        },
        //teststs: function (e) {
        //    debugger;
        //},
        initializeAfter: function () {
            console.log("WEBPassport.Views.WebPassportDreamClub:initializeAfter");
            this.listenTo(Backbone, "WEBPassport.Views.WebPassportDreamClub:returnToMainForm", this.returnToMainForm);
            this.listenTo(Backbone, "WEBPassport.Views.BalanceBonuses:balanceBonusHeader", this.balanceBonusHeader);

            _.bindAll(this, "onSuccessAfter", "onSuccessStartCheck");

            //  рендерим вьюшку бокового правого меню
            //Backbone.trigger('WEBPassport.Views.MainView:renderContextMenu', WEBPassport.Views.ProfileMenu);
        },
        onRender: function () {
            console.log("WEBPassport.Views.WebPassportDreamClub:onRender");
            if (isMobile) window.analytics.trackEvent(localStorage.devType, 'win_web_passport', 'Web passport', null);

            var $this = this;

            ons.compile(this.$el.get(0));
            this.$el.i18n();

            this.updateCSS();

            inpuEffects();
        },

        // клик по кнопка помощь
        openHalp: function () {
            console.log("WEBPassport.Views.WebPassportDreamClub:openHalp");

            mobipayNavigatorOpen(mobipayPage.halp, "lift", {
                info_text: i18n.t('wbs_info_profile_dream'),
                backgroundColor: this.model.attributes.backgroundColor
            });
        },

        updateCSS: function () {
            console.log("WEBPassport.Views.Wallet:updateCSS");

            var a = window.innerHeight - $(this.el).find("ons-toolbar").outerHeight(true);

            // расположить кнопку в самом низу
            this.ui.row_form.css("height", this.ui.row_form.height() + this.ui.edit_wp.outerHeight(true));

            if (a >= (this.ui.row_form.outerHeight(true)))
                this.ui.row_form.css("height",
                    this.ui.row_form.height() +
                    (a - this.ui.row_form.outerHeight(true)));

            this.ui.row_body.css("height", a + 1 + "px");
        },

        // клик по меню (справа) открыть
        openMenu: function () {
            console.log("WEBPassport.Views.WebPassportDreamClub:openMenu");
            Backbone.trigger("WEBPassport.Views.MainView:openMenu");
        },

        // клик на кнопку обновить фото
        changeAvatar: function () {
            //ShowAlert(i18n.t('wbs_coming_soon_label'));
            //return;
            console.log("WEBPassport.Views.WebPassportDreamClub:changeAvatar");
            if (isMobile) window.analytics.trackEvent(localStorage.devType, 'win_web_passport', 'Add foto', null);

            var $this = this;

            navigator.notification.confirm(i18n.t('wbs_change_photo_msg'), function (buttonIndex) {
                console.log(buttonIndex);
                if (buttonIndex > 0) {
                    var imageSource = 1;
                    if (buttonIndex == 1) {
                        imageSource = 0;
                        window.imagePicker.getPictures(
                            function (results) {
                                for (var i = 0; i < results.length; i++) {
                                    console.log('Image URI: ' + results[i]);
                                    $this.uploadPhoto(results[i]);
                                }
                            }, function (error) {
                                console.log('Error: ' + error);
                            },
                            {
                                maximumImagesCount: 1
                                /*width: 300,
                                 height: 300*/
                            }
                        );
                    }
                    else {
                        navigator.camera.getPicture(function (imageData) {
                            console.log(imageData);
                            resolveLocalFileSystemURL(imageData,
                                function (e) {
                                    console.log(e);
                                    $this.uploadPhoto(e.nativeURL);
                                },
                                function (e) {
                                    console.log(e)
                                }
                            );

                        }, function (message) {
                            console.log('get picture failed');
                        }, {
                            destinationType: navigator.camera.DestinationType.FILE_URI,
                            sourceType: imageSource,
                            correctOrientation: true,
                            allowEdit: false
                            /*targetWidth: 300,
                             targetHeigth: 300*/
                        }
                        );
                    }
                }
            }, '', [i18n.t('wbs_album_label'), i18n.t('wbs_camera_label')]);
        },
        uploadPhoto: function (imageURI) {
            console.log(imageURI);
            ShowLoader();
            //console.log(FileEntry.toURL(imageURI));
            var options = new FileUploadOptions();
            options.fileKey = "profile_image";
            options.fileName = md5(imageURI.substr(imageURI.lastIndexOf('/') + 1)) + imageURI.substring(imageURI.length - 4);
            options.mimeType = "image/png";
            options.httpMethod = "POST";
            options.headers = {
                "Authorization": "Basic " + btoa(localStorage.session + ":")
            };

            var params = new Object();
            params.par = JSON.stringify({ "type": "avatar_orig", "account_id": this.model.get('account_id'), "w": 400, "h": 400, "center": 1 });
            params.load_photo = '1.0.0.1';

            options.params = params;
            options.chunkedMode = false;

            var ft = new FileTransfer();
            ft.upload(imageURI, localStorage.url + "/profile-image", this.successUpload, this.failUpload, options);
        },
        successUpload: function (r) {
            console.log("SUCCESS");
            console.log("Response = " + r.response);
            if (JSON.parse(r.response).success) {
                $($('.foto')[0]).attr('data-filename', JSON.parse(r.response).data.photo_big);
                $($('.foto')[0]).css('background', 'url(' + JSON.parse(r.response).data.photo_big + ') no-repeat center');
                WEBPassport.mainViewModel.set({
                    photo: JSON.parse(r.response).data.photo_big,
                });
                Backbone.trigger('request:updatePhoto');
            }
            HideLoader();
        },
        failUpload: function (error) {
            console.log("ERROR");
            console.log(error);
            ShowAlert(i18n.t("wbs_upload_avatar_error_msg"), null);
            //alert("An error has occurred: Code = " + error.code);
            console.log("upload error source " + error.source);
            console.log("upload error target " + error.target);
            HideLoader();
        },
        // клик на поле ДР
        showDatepicker: function (e) {
            if (isMobile)
                showDatepicker(e, null, dateFormat);
        },

        // клик на поле ПОЛ
        changeRM: function () {
            // отменяем все выделения
            $(this.ui.woman).removeClass("checked");
            $(this.ui.man).removeClass("checked");

            // окрашиваем текст
            if (this.ui.r_m.prop("checked"))
                $(this.ui.woman).addClass("checked");
            else
                $(this.ui.man).addClass("checked");
        },

        selectMan: function () {
            console.log("WEBPassport.Views.WebPassportDreamClub:selectMan");
            $(this.ui.edit_rm_woman).removeClass("checked");
            $(this.ui.edit_rm_man).addClass("checked");
            this.ui.r_m.prop('checked', false);
        },
        selectWoman: function () {
            console.log("WEBPassport.Views.WebPassportDreamClub:selectMan");
            $(this.ui.edit_rm_man).removeClass("checked");
            $(this.ui.edit_rm_woman).addClass("checked");
            this.ui.r_m.prop('checked', true);
        },
        // клик на кнопку сохранить изменения
        editWP: function () {
            var session = localStorage.session;

            // если основыние молия Ф и И не заполнены возвращаем
            if (!this.ui.fname_input.val() || !this.ui.lname_input.val()) {
                ShowAlert(i18n.t("wbs_fname_lname_error_msg"));
                return null;
            }

            // собираем модель
            var data = {
                birthday: this.ui.birthday_input.val() ? moment(this.ui.birthday_input.val(), dateFormat).format('YYYY-MM-DD') : "",
                fname: this.ui.fname_input.val(),
                lname: this.ui.lname_input.val(),
                sex: this.ui.r_m.prop("checked") ? 0 : 1,
                photo: $($(this.el).find('.foto')[0]).data('filename')
            };

            if (!data.birthday) {
                ShowAlert(i18n.t("wbs_new_invoice_error"));
                return;
            }

            ShowLoader();

            // отправка запроса
            WEBPassport.requestModel.editProfile(session, data, this.onSuccessAfter);
        },

        onSuccessAfter: function (model, response, options) {
            console.log("WEBPassport.Views.WebPassportDreamClub:onSuccessAfter");
            console.log(response.data);
            var $this = this;
            ShowLoader();
            console.log("WEBPassport.Views.WebPassportDreamClub:onSuccessAfter session = " + localStorage.session);

            // отправка запроса
            WEBPassport.requestModel.getProfile(this.onSuccessStartCheck);
        },
        onSuccessStartCheck: function (model, response, options) {
            HideLoader();
            ShowAlert(i18n.t('wbs_data_stored_msg'));
        },
        balanceBonusHeader: function (balance) {
            console.log("WEBPassport.Views.WebPassportDreamClub:balancePromoHeader");

            if (this.ui.balance_header.length != 0) {
                this.ui.balance_header.text(balance)
            }
        },
        goBalanceBonuses: function () {
            console.log("WEBPassport.Views.WebPassportDreamClub:goBalanceBonuses");
            mobipayNavigatorOpen(mobipayPage.balance_bonuses, "left");
        },
    });

    //  вьюшка бокового правого меню
    WEBPassport.Views.ProfileMenu = Marionette.ItemView.extend({
        template: "#template-profile-menu",
        ui: {
            halp: "#halp", // кнопка halp
        },
        events: {
            "click @ui.halp": "openHalp", // клик по кнопка помощь
        },
        initialize: function () {
            console.log("WEBPassport.Views.ProfileMenu:initialize");
            this.bindUIElements();
        },
        onRender: function () {
            console.log("WEBPassport.Views.ProfileMenu:onRender");

            ons.compile(this.$el.get(0));
        },

        // клик по кнопка помощь
        openHalp: function () {
            console.log("WEBPassport.Views.ProfileMenu:openHalp");

            // открываем страницу с задержкой так как
            // сначала закрывается меню боковое и потом мы открываем новую страницу
            setTimeout(function () {
                mobipayNavigatorOpen(mobipayPage.halp, "lift", {
                    helpURL: i18n.t('wbs_passports_help_url'),
                    backgroundColor: WEBPassport.Views.webPassport.model.attributes.backgroundColor
                });
            }, timeoutAnimate);
        }
    });
});
